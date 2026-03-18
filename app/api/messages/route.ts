import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { body, conversationId, imageUrl, videoUrl, documentUrl, voiceNoteUrl } = await req.json();

    if (!conversationId) {
      return NextResponse.json({ error: "Conversation ID is required" }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        body,
        imageUrl,
        videoUrl,
        documentUrl,
        voiceNoteUrl,
        conversationId,
        senderId: user.id,
      },
      include: {
        sender: true,
      }
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
