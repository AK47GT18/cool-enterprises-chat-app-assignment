import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SessionService } from '@/services/session.service';
import { MessageService } from '@/services/message.service';

export async function POST(req: Request) {
  try {
    const { user, error } = await SessionService.requireAuth();
    if (error) return error;

    const { body, conversationId, imageUrl, videoUrl, documentUrl, voiceNoteUrl } = await req.json();

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
    });

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
  } catch (error) {
    console.error("[MESSAGES_POST]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
