import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '@/services/session.service';
import { realtimeBus } from '@/lib/realtime-bus';
import { REALTIME_EVENTS } from '@/lib/realtime-constants';

export async function POST(req: NextRequest) {
  try {
    const { user, error } = await SessionService.requireAuth();
    if (error) return error;

    const { status } = await req.json();

    realtimeBus.emit(REALTIME_EVENTS.PRESENCE_UPDATE, {
      userId: user.id,
      status: status,
      timestamp: Date.now()
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
