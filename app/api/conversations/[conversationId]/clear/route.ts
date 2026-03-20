import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SessionService } from '@/services/session.service';
import { realtimeBus, REALTIME_EVENTS } from '@/lib/realtime-bus';

export async function POST(
  req: Request,
  { params }: { params: { conversationId: string } }
) {
  try {
    const { user: currentUser, error: authError } = await SessionService.requireAuth();
    if (authError) return authError;

    const { conversationId } = params;

    const membership = await prisma.userConversation.findUnique({
      where: {
        userId_conversationId: {
          userId: currentUser.id,
          conversationId
        }
      }
    });

    if (!membership) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    await prisma.userConversation.update({
      where: {
        id: membership.id
      },
      data: {
        clearedAt: new Date(),
        hasSeenLatest: true
      }
    });

    realtimeBus.emit(REALTIME_EVENTS.CONVERSATION_UPDATE, {
      id: conversationId,
      cleared: true,
      userId: currentUser.id
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[CONVERSATION_CLEAR]", err);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
