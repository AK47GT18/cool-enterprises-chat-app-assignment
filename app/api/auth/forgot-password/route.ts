import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EmailService } from '@/services/email.service';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Fail silently to prevent email enumeration
      return NextResponse.json({ success: true, message: 'Recovery email dispatched' });
    }

    // Generate cryptographically secure local token
    const { randomBytes } = await import('crypto');
    const token = randomBytes(32).toString('hex');
    const expiresAt = Date.now() + (1000 * 60 * 60); // 1 hour from now
    
    await (prisma as any).passwordResetToken.create({
      data: {
        email,
        token,
        expiresAt: new Date(expiresAt),
      }
    });

    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}`;

    // Fire off the beautifully styled Nodemailer email!
    const { success, error: emailError } = await EmailService.sendPasswordReset(email, resetLink);
    
    if (!success) {
      console.error("Nodemailer Email sent failed:", emailError);
      return NextResponse.json({ error: 'Failed to dispatch email' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Recovery email dispatched' });
  } catch (err) {
    console.error('[FORGOT_PASSWORD]', err);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
