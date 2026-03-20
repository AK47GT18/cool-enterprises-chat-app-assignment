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

    // Delete the membership entry
    await prisma.userConversation.delete({
      where: {
        userId_conversationId: {
          userId: user.id,
          conversationId
        }
      }
    });

    // Emit real-time event so clients update instantly
    realtimeBus.emit(REALTIME_EVENTS.CONVERSATION_UPDATE, {
      id: conversationId,
      memberLeft: user.id
    });

    return NextResponse.json({ success: true, conversationId });
  } catch (err) {
    console.error("[CONVERSATION_LEAVE_DELETE]", err);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

