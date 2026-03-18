import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SessionService } from '@/services/session.service';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    const { user, error } = await SessionService.requireAuth();
    if (error) return error;

    const where: any = {
      AND: [
        { isPrivate: false },
        { id: { not: user.id } },
      ],
    };

    if (query) {
      where.AND.push({
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      });
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        image: true,
      },
      take: 20,
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("[USERS_SEARCH_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
