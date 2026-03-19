import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SessionService } from '@/services/session.service';
import { MessageService } from '@/services/message.service';

export async function POST(req: Request) {
  try {
    const { user, error: authError } = await SessionService.requireAuth();
    if (authError) return authError;

    const { body, conversationId, imageUrl, videoUrl, documentUrl, voiceNoteUrl, replyToId } = await req.json();

    if (!conversationId) {
      return NextResponse.json({ error: "Conversation ID is required" }, { status: 400 });
    }

    const message = await MessageService.createMessage({
      body,
      imageUrl,
      videoUrl,
      documentUrl,
      voiceNoteUrl,
      conversationId,
      senderId: user.id,
      replyToId,
    });

    // Notify local realtime bus
    const { realtimeBus, REALTIME_EVENTS } = await import('@/lib/realtime-bus');
    realtimeBus.emit(REALTIME_EVENTS.MESSAGE_NEW, message);

    // Update unread status for other members
    await prisma.userConversation.updateMany({
      where: {
        conversationId,
        userId: {
          not: user.id
        }
      },
      data: {
        hasSeenLatest: false
      }
    });

    return NextResponse.json(message);
  } catch (err) {
    console.error("[MESSAGES_POST]", err);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
