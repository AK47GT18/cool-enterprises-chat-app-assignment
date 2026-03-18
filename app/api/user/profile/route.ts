import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SessionService } from '@/services/session.service';

export async function GET() {
  try {
    const { user, error } = await SessionService.requireAuth();
    if (error) return error;

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        conversations: {
          include: {
            conversation: true
          }
        }
      }
    });

    return NextResponse.json(profile);
  } catch (err) {
    console.error("[USER_PROFILE_GET]", err);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { user, error } = await SessionService.requireAuth();
    if (error) return error;

    const { username, image, isPrivate } = await req.json();

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(username && { username }),
        ...(image && { image }),
        ...(typeof isPrivate === 'boolean' && { isPrivate }),
      }
    });

    return NextResponse.json(updatedUser);
  } catch (err) {
    console.error("[USER_PROFILE_PATCH]", err);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
