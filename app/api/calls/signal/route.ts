import { NextRequest, NextResponse } from 'next/server';
import { realtimeBus } from '@/lib/realtime-bus';
import { REALTIME_EVENTS } from '@/lib/realtime-constants';
import { SessionService } from '@/services/session.service';

export async function POST(req: NextRequest) {
  try {
    const { user, error: authError } = await SessionService.requireAuth();
    if (authError) return authError;

    const { event, data } = await req.json();

    if (!Object.values(REALTIME_EVENTS).includes(event)) {
      return NextResponse.json({ error: 'Invalid event' }, { status: 400 });
    }

    // Emit the event to the global bus
    realtimeBus.emit(event, data);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error emitting real-time event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
