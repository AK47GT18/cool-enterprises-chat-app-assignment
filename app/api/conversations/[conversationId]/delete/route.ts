import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SessionService } from '@/services/session.service';
import { realtimeBus, REALTIME_EVENTS } from '@/lib/realtime-bus';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;
    const { user, error: authError } = await SessionService.requireAuth();
    if (authError) return authError;

    // Verify user is ADMIN or SUPER_ADMIN
    const membership = await prisma.userConversation.findUnique({
      where: {
        userId_conversationId: {
          userId: user.id,
          conversationId
        }
      }
    });

    if (!membership || (membership.role !== 'ADMIN' && membership.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: "Only admins can delete communities" }, { status: 403 });
    }

    // Verify it's a group
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation || !conversation.isGroup) {
      return NextResponse.json({ error: "Not a group conversation" }, { status: 400 });
    }

    // Delete all related data in order
    await prisma.reaction.deleteMany({
      where: { message: { conversationId } }
    });

    await prisma.message.deleteMany({
      where: { conversationId }
    });

    await prisma.userConversation.deleteMany({
      where: { conversationId }
    });

    await prisma.conversation.delete({
      where: { id: conversationId }
    });

    // Notify all clients
    realtimeBus.emit(REALTIME_EVENTS.CONVERSATION_UPDATE, {
      id: conversationId,
      deleted: true
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[CONVERSATION_DELETE]", err);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
