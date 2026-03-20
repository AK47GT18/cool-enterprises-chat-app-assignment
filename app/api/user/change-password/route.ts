import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SessionService } from '@/services/session.service';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { user, error: authError } = await SessionService.requireAuth();
    if (authError) return authError;

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Fetch user from DB to get the hashed password
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id }
    });

    if (!dbUser || !dbUser.hashedPassword) {
      return NextResponse.json({ error: "User not found or using OAuth" }, { status: 404 });
    }

    // 2. Verify current password
    const isValid = await bcrypt.compare(currentPassword, dbUser.hashedPassword);
    if (!isValid) {
      return NextResponse.json({ error: "Incorrect current password" }, { status: 401 });
    }

    // 3. Validate new password strength
    if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/.test(newPassword)) {
      return NextResponse.json({ 
        error: "New password must be at least 8 characters and include a letter and a number." 
      }, { status: 400 });
    }

    // 4. Hash new password and update
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { hashedPassword: hashedNewPassword }
    });

    return NextResponse.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    console.error("[CHANGE_PASSWORD_POST]", err);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
