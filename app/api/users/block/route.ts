import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SessionService } from '@/services/session.service';

export async function POST(
  req: Request
) {
  try {
    const { userId } = await req.json();
    const { user: currentUser, error: authError } = await SessionService.requireAuth();
    if (authError) return authError;

    if (!userId) {
      return new NextResponse("User ID is required", { status: 400 });
    }

    // Update or create a contact request with status BLOCKED
    await prisma.contactRequest.upsert({
      where: {
        senderId_receiverId: {
          senderId: currentUser.id,
          receiverId: userId
        }
      },
      update: { status: 'BLOCKED' },
      create: {
        senderId: currentUser.id,
        receiverId: userId,
        status: 'BLOCKED'
      }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
