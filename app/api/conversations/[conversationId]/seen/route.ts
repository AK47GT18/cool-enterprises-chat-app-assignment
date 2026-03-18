import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SessionService } from '@/services/session.service';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;
    const { user, error: authError } = await SessionService.requireAuth();
    if (authError) return authError;

    await prisma.userConversation.update({
      where: {
        userId_conversationId: {
          userId: user.id,
          conversationId
        }
      },
      data: {
        hasSeenLatest: true
      }
    });

    // Notify local realtime bus
    const { realtimeBus, REALTIME_EVENTS } = await import('@/lib/realtime-bus');
    realtimeBus.emit(REALTIME_EVENTS.MESSAGE_SEEN, { userId: user.id, conversationId });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[CONVERSATION_SEEN_POST]", err);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
