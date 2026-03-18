import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SessionService } from '@/services/session.service';
import { Role } from '@prisma/client';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ conversationId: string; userId: string }> }
) {
  try {
    const { conversationId, userId } = await params;
    const { role } = await req.json();
    const { user: currentUser, error } = await SessionService.requireAuth();
    if (error) return error;

    // Check if current user is ADMIN or SUPER_ADMIN
    const currentMember = await prisma.userConversation.findUnique({
      where: {
        userId_conversationId: {
          userId: currentUser.id,
          conversationId
        }
      }
    });

    if (!currentMember || (currentMember.role !== Role.ADMIN && currentMember.role !== Role.SUPER_ADMIN)) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Target member
    const targetMember = await prisma.userConversation.findUnique({
      where: {
        userId_conversationId: {
          userId,
          conversationId
        }
      }
    });

    if (!targetMember) {
      return new NextResponse("Member not found", { status: 404 });
    }

    // Prevent demoting/promoting SUPER_ADMIN
    if (targetMember.role === Role.SUPER_ADMIN) {
      return new NextResponse("Cannot modify Super Admin", { status: 403 });
    }

    // If current is only ADMIN, they can't make others SUPER_ADMIN or modify other ADMINS (optional logic)
    // For now, let's keep it simple: SUPER_ADMIN can do anything, ADMIN can promote/demote regular members.
    
    if (currentMember.role === Role.ADMIN && targetMember.role === Role.ADMIN) {
        return new NextResponse("Admins cannot modify other Admins", { status: 403 });
    }

    const updatedMember = await prisma.userConversation.update({
      where: {
        userId_conversationId: {
          userId,
          conversationId
        }
      },
      data: { role }
    });

    return NextResponse.json(updatedMember);
  } catch (err) {
    console.error("[MEMBER_PATCH]", err);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ conversationId: string; userId: string }> }
) {
  try {
    const { conversationId, userId } = await params;
    const { user: currentUser, error } = await SessionService.requireAuth();
    if (error) return error;

    // Check if current user is ADMIN or SUPER_ADMIN OR is trying to leave (userId === currentUser.id)
    const currentMember = await prisma.userConversation.findUnique({
      where: {
        userId_conversationId: {
          userId: currentUser.id,
          conversationId
        }
      }
    });

    const isSelfRemove = userId === currentUser.id;

    if (!currentMember || (!isSelfRemove && currentMember.role !== Role.ADMIN && currentMember.role !== Role.SUPER_ADMIN)) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Target member
    const targetMember = await prisma.userConversation.findUnique({
      where: {
        userId_conversationId: {
          userId,
          conversationId
        }
      }
    });

    if (!targetMember) {
      return new NextResponse("Member not found", { status: 404 });
    }

    if (targetMember.role === Role.SUPER_ADMIN) {
      return new NextResponse("Cannot remove Super Admin", { status: 403 });
    }

    if (currentMember.role === Role.ADMIN && targetMember.role === Role.ADMIN) {
        return new NextResponse("Admins cannot remove other Admins", { status: 403 });
    }

    await prisma.userConversation.delete({
      where: {
        userId_conversationId: {
          userId,
          conversationId
        }
      }
    });

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("[MEMBER_DELETE]", err);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
