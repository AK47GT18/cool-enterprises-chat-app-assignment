import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SessionService } from '@/services/session.service';

import { realtimeBus } from '@/lib/realtime-bus';
import { REALTIME_EVENTS } from '@/lib/realtime-constants';

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

    const body = await req.json();
    console.log("[USER_PROFILE_PATCH] User ID:", user.id);
    console.log("[USER_PROFILE_PATCH] Body:", body);
    const { username, image, bio, isPrivate } = body;

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(username && { username: username.trim() }),
        ...(image && { image }),
        ...(bio !== undefined && { bio: bio.trim() }),
        ...(typeof isPrivate === 'boolean' && { isPrivate }),
      }
    });

    // Emit real-time update
    realtimeBus.emit(REALTIME_EVENTS.USER_UPDATE, {
      id: updatedUser.id,
      username: updatedUser.username,
      image: updatedUser.image,
      bio: updatedUser.bio
    });

    return NextResponse.json(updatedUser);
  } catch (err: any) {
    console.error("[USER_PROFILE_PATCH] Error:", err.message || err);
    
    // Return more specific error for common issues
    if (err.code === 'P2002') {
      const target = err.meta?.target || ['field'];
      return NextResponse.json({ 
        error: `The ${target.join(', ')} is already in use.` 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: "Internal Error",
      details: err.message
    }, { status: 500 });
  }
}
