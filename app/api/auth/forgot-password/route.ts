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

    // Generate 6-digit numeric code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + (1000 * 60 * 15); // 15 minutes from now
    
    await (prisma as any).passwordResetToken.create({
      data: {
        email,
        token: code, // Reusing the 'token' field to store the code
        expiresAt: new Date(expiresAt),
      }
    });

    // Fire off the numeric code email!
    const { success, error: emailError } = await EmailService.sendPasswordResetCode(email, code);
    
    if (!success) {
      console.error("Nodemailer Email sent failed:", emailError);
      return NextResponse.json({ error: 'Failed to dispatch email' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Recovery code dispatched' });
  } catch (err) {
    console.error('[FORGOT_PASSWORD]', err);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
