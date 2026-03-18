import { NextResponse } from 'next/server';
import { SessionService } from '@/services/session.service';
import { MessageService } from '@/services/message.service';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const { user, error } = await SessionService.requireAuth();
    if (error) return error;

    const { messageId } = await params;
    const { emoji } = await req.json();

    if (!emoji) {
      return new NextResponse("Emoji is required", { status: 400 });
    }

    const result = await MessageService.toggleReaction(messageId, user.id, emoji);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[REACTIONS_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
