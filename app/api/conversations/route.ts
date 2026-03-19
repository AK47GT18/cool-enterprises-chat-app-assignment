import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SessionService } from '@/services/session.service';
import { Role } from '@prisma/client';
import { decryptMessage } from '@/lib/encryption';

export async function POST(req: Request) {
  try {
    const { user, error: authError } = await SessionService.requireAuth();
    if (authError) return authError;

    const { name, description, imageUrl, isGroup, isPublicGroup, memberIds } = await req.json();

    const conversation = await prisma.conversation.create({
      data: {
        name,
        description,
        imageUrl,
        isGroup,
        isPublicGroup,
        members: {
          create: [
            { userId: user.id, role: Role.SUPER_ADMIN },
            ...(memberIds || []).map((id: string) => ({ userId: id, role: Role.MEMBER }))
          ]
        }
      },
      include: {
        members: {
          include: {
            user: true
          }
        }
      }
    });

    return NextResponse.json(conversation);
  } catch (err) {
    console.error("[CONVERSATIONS_POST]", err);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}


export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    const { user, error: authError } = await SessionService.requireAuth();
    if (authError) return authError;

    if (id) {
      const conversation = await prisma.conversation.findUnique({
        where: { id },
        include: {
          messages: {
            include: {
              sender: {
                select: {
                  username: true,
                  image: true,
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  image: true,
                }
              }
            }
          }
        }
      });

      if (!conversation) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      const isMember = conversation.members.some((m: any) => m.user.id === user.id);
      if (!isMember) {
        return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
      }

      return NextResponse.json(conversation);
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        members: {
          some: {
            userId: user.id
          }
        }
      },
      include: {
        members: {
          include: {
            user: true
          }
        },
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedConversations = conversations.map(chat => {
      let displayName = chat.name;
      let displayImage = chat.imageUrl;

      if (!chat.isGroup) {
        const otherMember = chat.members.find((m: any) => m.userId !== user.id);
        if (otherMember) {
          displayName = otherMember.user.username;
          displayImage = otherMember.user.image;
        }
      }

      const lastMessage = chat.messages[0] ? {
        ...chat.messages[0],
        body: chat.messages[0].body ? decryptMessage(chat.messages[0].body) : chat.messages[0].body
      } : null;

      return {
        ...chat,
        name: displayName,
        imageUrl: displayImage,
        messages: lastMessage ? [lastMessage] : []
      };
    });

    return NextResponse.json(formattedConversations);
  } catch (err) {
    console.error("[CONVERSATIONS_GET]", err);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
