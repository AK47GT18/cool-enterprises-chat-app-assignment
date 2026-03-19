import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SessionService } from '@/services/session.service';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    const { user, error: authError } = await SessionService.requireAuth();
    if (authError) return authError;

    // 1. Find blocked users (both ways)
    const blockedRequests = await prisma.contactRequest.findMany({
      where: {
        OR: [{ senderId: user.id }, { receiverId: user.id }],
        status: 'BLOCKED'
      },
      select: { senderId: true, receiverId: true }
    });

    const blockedUserIds = blockedRequests.map(r => 
      r.senderId === user.id ? r.receiverId : r.senderId
    );

    const where: any = {
      AND: [
        { id: { not: user.id } },
        { id: { notIn: blockedUserIds } },
      ],
    };

    if (query) {
      where.AND.push({
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { privacyCode: { equals: query } }, // Direct match for privacy codes
          { AND: [{ isPrivate: false }, { username: { contains: query, mode: 'insensitive' } }] } // Redundant but safe
        ],
      });
      
      // If no results for public users, we check if it matches a privacy code exactly
      // (The OR above already handles this, but let's make sure it doesn't leak private users by name)
      where.AND.push({
        OR: [
          { isPrivate: false },
          { privacyCode: { equals: query } }
        ]
      });
    } else {
      // Default: only show public users
      where.AND.push({ isPrivate: false });
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        image: true,
        sentRequests: {
          where: { receiverId: user.id },
          select: { status: true }
        },
        receivedRequests: {
          where: { senderId: user.id },
          select: { status: true }
        }
      },
      take: 20,
    });

    const formattedUsers = users.map(u => {
      const request = u.sentRequests[0] || u.receivedRequests[0];
      return {
        id: u.id,
        username: u.username,
        image: u.image,
        hollerStatus: request ? request.status : null
      };
    });

    return NextResponse.json(formattedUsers);
  } catch (err) {
    console.error("[USERS_SEARCH_GET]", err);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
