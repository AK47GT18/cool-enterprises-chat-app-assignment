import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SessionService } from '@/services/session.service';

export async function GET() {
  try {
    const { user, error: authError } = await SessionService.requireAuth();
    if (authError) return authError;

    // Get all public groups the user is NOT already a member of
    const publicGroups = await prisma.conversation.findMany({
      where: {
        isGroup: true,
        isPublicGroup: true,
        NOT: {
          members: {
            some: {
              userId: user.id
            }
          }
        }
      },
      include: {
        _count: {
          select: { members: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    });

    const formatted = publicGroups.map(g => ({
      id: g.id,
      name: g.name,
      description: g.description,
      imageUrl: g.imageUrl,
      memberCount: g._count.members,
      inviteCode: g.inviteCode
    }));

    return NextResponse.json(formatted);
  } catch (err) {
    console.error("[GROUPS_PUBLIC_GET]", err);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
