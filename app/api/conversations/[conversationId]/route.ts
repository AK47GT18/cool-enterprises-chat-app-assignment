import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SessionService } from '@/services/session.service';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;
    const { user, error } = await SessionService.requireAuth();
    if (error) return error;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                image: true,
                email: true,
              }
            }
          }
        },
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    });

    if (!conversation) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // Check if user is a member
    const isMember = conversation.members.some(m => m.userId === user.id);
    if (!isMember) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    return NextResponse.json(conversation);
  } catch (error) {
    console.error("[CONVERSATION_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}


export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;
    const { name, description, imageUrl } = await req.json();
    const { user, error } = await SessionService.requireAuth();
    if (error) return error;

    // Check if user is ADMIN or SUPER_ADMIN
    const member = await prisma.userConversation.findUnique({
      where: {
        userId_conversationId: {
          userId: user.id,
          conversationId
        }
      }
    });

    if (!member || (member.role !== 'ADMIN' && member.role !== 'SUPER_ADMIN')) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const updatedConversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        name,
        description,
        imageUrl
      }
    });

    return NextResponse.json(updatedConversation);
  } catch (error) {
    console.error("[CONVERSATION_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
