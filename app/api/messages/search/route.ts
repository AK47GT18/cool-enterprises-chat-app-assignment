import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SessionService } from '@/services/session.service';
import { decryptMessage } from '@/lib/encryption';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.toLowerCase();

    if (!q || q.length < 2) {
      return NextResponse.json([]);
    }

    const { user, error: authError } = await SessionService.requireAuth();
    if (authError) return authError;

    // Fetch recent messages for user's conversations
    // We limit to 500 to prevent memory/timeout issues while decrypting
    const messages = await prisma.message.findMany({
      where: {
        conversation: {
          members: {
            some: {
              userId: user.id
            }
          }
        },
        isDeleted: false
      },
      take: 500,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        conversation: true,
        sender: {
          select: {
            username: true,
            image: true
          }
        }
      }
    });

    const matches = [];

    for (const msg of messages) {
      if (!msg.body) continue;
      
      try {
        const decryptedBody = decryptMessage(msg.body);
        if (decryptedBody.toLowerCase().includes(q)) {
          matches.push({
            ...msg,
            body: decryptedBody,
            conversationName: msg.conversation.isGroup 
              ? msg.conversation.name 
              : 'Private Chat' // We don't have the exact other member's name here without more queries, but we can pass it
          });
        }
      } catch (e) {
        // Skip decryption errors
      }

      // Max 20 results
      if (matches.length >= 20) break;
    }

    return NextResponse.json(matches);
  } catch (err) {
    console.error("[MESSAGE_SEARCH_GET]", err);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
