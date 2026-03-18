import { NextResponse } from 'next/server';
import { SessionService } from '@/services/session.service';
import { realtimeBus, REALTIME_EVENTS } from '@/lib/realtime-bus';

export async function POST(req: Request) {
  try {
    const { user, error: authError } = await SessionService.requireAuth();
    if (authError) return authError;

    const { conversationId, isTyping } = await req.json();

    if (!conversationId) {
      return NextResponse.json({ error: "Conversation ID is required" }, { status: 400 });
    }

    const event = isTyping ? REALTIME_EVENTS.TYPING_START : REALTIME_EVENTS.TYPING_STOP;
    realtimeBus.emit(event, { userId: user.id, conversationId });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[TYPING_POST]", err);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
