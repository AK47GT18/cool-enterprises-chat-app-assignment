import { NextResponse } from 'next/server';
import { SessionService } from '@/services/session.service';
import { MessageService } from '@/services/message.service';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const { user, error } = await SessionService.requireAuth();
    if (error) return error;

    const { messageId } = await params;

    const deletedMessage = await MessageService.softDeleteMessage(messageId, user.id);

    // Notify local realtime bus
    const { realtimeBus, REALTIME_EVENTS } = await import('@/lib/realtime-bus');
    realtimeBus.emit(REALTIME_EVENTS.MESSAGE_UPDATE, deletedMessage);

    return NextResponse.json(deletedMessage);
  } catch (error: any) {
    console.error('[MESSAGE_DELETE]', error);
    if (error.message === "Unauthorized or not found") {
      return new NextResponse(error.message, { status: 401 });
    }
    return new NextResponse('Internal Error', { status: 500 });
  }
}
