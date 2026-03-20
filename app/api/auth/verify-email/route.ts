import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EmailService } from '@/services/email.service';
import { SessionService } from '@/services/session.service';
import { checkRateLimit } from '@/lib/validation';
import { randomBytes } from 'crypto';

// Token expiration times
const VERIFICATION_TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
const VERIFICATION_EMAIL_COOLDOWN = 60 * 1000; // 1 minute between resend requests

/**
 * POST - Send verification email
 * Requires authentication - sends to the logged-in user's email
 */
export async function POST(req: NextRequest) {
    try {
        const { user, error: authError } = await SessionService.requireAuth();
        if (authError) return authError;

        const rateLimitKey = `verify-email:${user.id}`;
        const rateLimit = checkRateLimit(rateLimitKey, 5, 60); // 5 requests per hour

        if (!rateLimit.allowed) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again later.' },
                { status: 429 }
            );
        }

        // Check if already verified
        if (user.isEmailVerified) {
            return NextResponse.json({ message: 'Email already verified' });
        }

        // Check for existing unexpired token
        const existingToken = await prisma.verificationToken.findUnique({
            where: { userId: user.id }
        });

        if (existingToken) {
            const timeSinceCreation = Date.now() - existingToken.createdAt.getTime();
            if (timeSinceCreation < VERIFICATION_EMAIL_COOLDOWN) {
                const waitSeconds = Math.ceil((VERIFICATION_EMAIL_COOLDOWN - timeSinceCreation) / 1000);
                return NextResponse.json(
                    { error: `Please wait ${waitSeconds} seconds before requesting another email` },
                    { status: 429 }
                );
            }
        }

        // Generate secure verification token
        const token = randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY);

        // Upsert verification token
        await prisma.verificationToken.upsert({
            where: { userId: user.id },
            update: {
                token,
                expiresAt,
                createdAt: new Date(),
            },
            create: {
                userId: user.id,
                token,
                expiresAt,
            },
        });

        // Send verification email
        const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${token}`;
        const { success, error: emailError } = await EmailService.sendVerificationEmail(
            user.email,
            user.username,
            verificationUrl
        );

        if (!success) {
            console.error('Failed to send verification email:', emailError);
            return NextResponse.json(
                { error: 'Failed to send verification email. Please try again.' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            message: 'Verification email sent',
            expiresIn: VERIFICATION_TOKEN_EXPIRY,
        });
    } catch (err) {
        console.error('[VERIFY_EMAIL_POST]', err);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

/**
 * GET - Verify email with token
 * This is the endpoint that verifies the token from the email
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.redirect(new URL('/auth/verify?error=missing_token', req.url));
        }

        // Find token in database
        const verificationToken = await prisma.verificationToken.findUnique({
            where: { token },
            include: { user: true }
        });

        if (!verificationToken) {
            return NextResponse.redirect(new URL('/auth/verify?error=invalid_token', req.url));
        }

        // Check if expired
        if (verificationToken.expiresAt < new Date()) {
            return NextResponse.redirect(new URL('/auth/verify?error=expired_token', req.url));
        }

        // Mark email as verified
        await prisma.user.update({
            where: { id: verificationToken.userId },
            data: { isEmailVerified: true }
        });

        // Delete the used token
        await prisma.verificationToken.delete({
            where: { token }
        });

        // Redirect to success page
        return NextResponse.redirect(new URL('/auth/verify?success=true', req.url));
    } catch (err) {
        console.error('[VERIFY_EMAIL_GET]', err);
        return NextResponse.redirect(new URL('/auth/verify?error=internal_error', req.url));
    }
}
