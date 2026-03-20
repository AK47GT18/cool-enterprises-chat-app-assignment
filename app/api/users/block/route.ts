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

    // 2. Restore UserConversation for the current user in all shared 1-on-1 chats
    const sharedConversations = await prisma.conversation.findMany({
      where: {
        isGroup: false,
        members: {
          some: { userId }
        }
      }
    });

    for (const convo of sharedConversations) {
      // Re-link the current user if they were removed during block
      await prisma.userConversation.upsert({
        where: {
          userId_conversationId: {
            conversationId: convo.id,
            userId: currentUser.id
          }
        },
        update: {}, // No changes needed if already exists
        create: {
          conversationId: convo.id,
          userId: currentUser.id
        }
      });
    }

    // 3. Emit Unblock event to both users
    const { realtimeBus, REALTIME_EVENTS } = await import('@/lib/realtime-bus');
    realtimeBus.emit(REALTIME_EVENTS.CONVERSATION_UPDATE, { 
      id: sharedConversations[0]?.id, 
      unblocked: true,
      blockerId: currentUser.id,
      unblockedId: userId
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
