import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json([]);
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { username: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
            ],
          },
          { isPrivate: false },
          { id: { not: user.id } },
        ],
      },
      select: {
        id: true,
        username: true,
        image: true,
      },
      take: 10,
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("[USERS_SEARCH_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
