import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EmailService } from '@/services/email.service';
import { checkRateLimit, validateEmail } from '@/lib/validation';
import { randomBytes } from 'crypto';

// Rate limiting constants
const MAX_RESET_ATTEMPTS = 5; // Max password reset requests per hour
const RESET_TOKEN_EXPIRY = 15 * 60 * 1000; // 15 minutes
const RESEND_COOLDOWN = 60 * 1000; // 1 minute between requests

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Validate email format
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return NextResponse.json({ error: emailValidation.error }, { status: 400 });
    }

    // Check rate limit
    const rateLimitKey = `password-reset:${email.toLowerCase()}`;
    const rateLimit = checkRateLimit(rateLimitKey, MAX_RESET_ATTEMPTS, 60);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many reset attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      // Fail silently to prevent email enumeration
      return NextResponse.json({ success: true, message: 'If the email exists, a recovery code will be sent' });
    }

    // Check for existing token
    const existingToken = await prisma.passwordResetToken.findFirst({
      where: { email: email.toLowerCase() }
    });

    // If token exists and not expired, check cooldown
    if (existingToken && existingToken.expiresAt > new Date()) {
      const timeSinceCreation = Date.now() - existingToken.createdAt.getTime();
      if (timeSinceCreation < RESEND_COOLDOWN) {
        const waitSeconds = Math.ceil((RESEND_COOLDOWN - timeSinceCreation) / 1000);
        return NextResponse.json(
          { error: `Please wait ${waitSeconds} seconds before requesting another code` },
          { status: 429 }
        );
      }
    }

    // Generate secure token (use numeric code for user-friendly experience)
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY);

    // Delete any existing token and create new one
    await prisma.passwordResetToken.deleteMany({
      where: { email: email.toLowerCase() }
    });

    await prisma.passwordResetToken.create({
      data: {
        email: email.toLowerCase(),
        token: code,
        expiresAt,
      }
    });

    // Send the code via email
    const { success, error: emailError } = await EmailService.sendPasswordResetCode(email, code);

    if (!success) {
      console.error('Email send failed:', emailError);
      return NextResponse.json({ error: 'Failed to send recovery email. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Recovery code sent',
      expiresIn: RESET_TOKEN_EXPIRY,
    });
  } catch (err) {
    console.error('[FORGOT_PASSWORD]', err);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
