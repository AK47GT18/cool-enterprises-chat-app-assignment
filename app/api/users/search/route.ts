import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SessionService } from '@/services/session.service';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    const { user, error: authError } = await SessionService.requireAuth();
    if (authError) return authError;

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
  } catch (err) {
    console.error("[USERS_SEARCH_GET]", err);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
