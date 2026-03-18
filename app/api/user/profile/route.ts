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
  } catch (error) {
    console.error("[USER_PROFILE_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { user, error } = await SessionService.requireAuth();
    if (error) return error;

    const { username, image } = await req.json();

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(username && { username }),
        ...(image && { image }),
      }
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("[USER_PROFILE_PATCH]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
