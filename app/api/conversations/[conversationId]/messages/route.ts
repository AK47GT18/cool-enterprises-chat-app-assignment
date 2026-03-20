import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SessionService } from '@/services/session.service';
import { decryptMessage } from '@/lib/encryption';

const MESSAGES_BATCH_SIZE = 30;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get('cursor');

    const { user, error: authError } = await SessionService.requireAuth();
    if (authError) return authError;

    // Verify membership
    const member = await prisma.userConversation.findUnique({
      where: {
        userId_conversationId: {
          userId: user.id,
          conversationId
        }
      }
    });

    if (!member) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const messages = await prisma.message.findMany({
      take: MESSAGES_BATCH_SIZE + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      where: {
        conversationId,
        ...(member.clearedAt ? { createdAt: { gt: member.clearedAt } } : {})
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        sender: {
          select: {
            username: true,
            image: true,
          }
        },
        replyTo: {
          include: {
            sender: {
              select: {
                username: true,
                image: true,
              }
            }
          }
        },
        reactions: true
      }
    });

    const decryptSafe = (body: string | null) => {
      if (!body) return body;
      try {
        return decryptMessage(body);
      } catch (e) {
        return body; // Fallback to raw if decryption fails
      }
    };

    const decryptedMessages = messages.map(msg => ({
      ...msg,
      body: decryptSafe(msg.body),
      replyTo: msg.replyTo ? {
        ...msg.replyTo,
        body: decryptSafe(msg.replyTo.body)
      } : null
    }));

    let nextCursor = null;
    if (decryptedMessages.length > MESSAGES_BATCH_SIZE) {
      const nextItem = decryptedMessages.pop();
      nextCursor = nextItem?.id;
    }

    return NextResponse.json({
      messages: decryptedMessages,
      nextCursor
    });

  } catch (err) {
    console.error("[MESSAGES_GET]", err);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
