import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SessionService } from '@/services/session.service';

// DELETE - Unblock a user
export async function DELETE(req: Request) {
  try {
    const { user: currentUser, error: authError } = await SessionService.requireAuth();
    if (authError) return authError;

    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Find and delete the BLOCKED contact request
    await prisma.contactRequest.deleteMany({
      where: {
        senderId: currentUser.id,
        receiverId: userId,
        status: 'BLOCKED'
      }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[UNBLOCK_USER]", err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Get list of users the current user has blocked
export async function GET() {
  try {
    const { user: currentUser, error: authError } = await SessionService.requireAuth();
    if (authError) return authError;

    const blockedRequests = await prisma.contactRequest.findMany({
      where: {
        senderId: currentUser.id,
        status: 'BLOCKED'
      },
      include: {
        receiver: {
          select: {
            id: true,
            username: true,
            image: true,
            email: true
          }
        }
      }
    });

    const blockedUsers = blockedRequests.map(br => ({
      id: br.receiver.id,
      username: br.receiver.username,
      image: br.receiver.image,
      email: br.receiver.email
    }));

    return NextResponse.json(blockedUsers);
  } catch (err) {
    console.error("[BLOCKED_USERS_GET]", err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
