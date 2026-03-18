import { NextResponse } from 'next/server';
import { SessionService } from '@/services/session.service';
import { MessageService } from '@/services/message.service';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const { user, errorResponse } = await SessionService.requireAuth();
    if (errorResponse) return errorResponse;

    const { messageId } = await params;

    const deletedMessage = await MessageService.softDeleteMessage(messageId, user.id);
    return NextResponse.json(deletedMessage);
  } catch (error: any) {
    console.error('[MESSAGE_DELETE]', error);
    if (error.message === "Unauthorized or not found") {
      return new NextResponse(error.message, { status: 401 });
    }
    return new NextResponse('Internal Error', { status: 500 });
  }
}
