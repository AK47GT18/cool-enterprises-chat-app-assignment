import { NextResponse } from 'next/server';
import { SessionService } from '@/services/session.service';
import { prisma } from '@/lib/prisma';
import { realtimeBus } from '@/lib/realtime-bus';
import { REALTIME_EVENTS } from '@/lib/realtime-constants';

export async function POST(req: Request) {
  try {
    const { user, error: authError } = await SessionService.requireAuth();
    if (authError) return authError;

    const { conversationId, isTyping } = await req.json();

    if (!conversationId) {
      return NextResponse.json({ error: "Conversation ID is required" }, { status: 400 });
    }

    // Verify the user is a member of this conversation
    const membership = await prisma.userConversation.findUnique({
      where: {
        userId_conversationId: {
          userId: user.id,
          conversationId
        }
      }
    });

    if (!membership) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }

    const event = isTyping ? REALTIME_EVENTS.TYPING_START : REALTIME_EVENTS.TYPING_STOP;
    realtimeBus.emit(event, { userId: user.id, conversationId });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[TYPING_POST]", err);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
