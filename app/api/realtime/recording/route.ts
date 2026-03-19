import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '@/services/session.service';
import { realtimeBus } from '@/lib/realtime-bus';
import { REALTIME_EVENTS } from '@/lib/realtime-constants';

export async function POST(req: NextRequest) {
  try {
    const { user, error } = await SessionService.requireAuth();
    if (error) return error;

    const { conversationId, isRecording } = await req.json();

    const eventName = isRecording ? REALTIME_EVENTS.RECORDING_START : REALTIME_EVENTS.RECORDING_STOP;
    
    realtimeBus.emit(eventName, {
      conversationId,
      userId: user.id
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
