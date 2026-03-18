import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SessionService } from '@/services/session.service';

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

    // If it's a 1-on-1, maybe we should delete the conversation? 
    // Usually "leave" for 1-on-1 means "delete/hide chat". 
    // For now, just removing the membership is enough to hide it from ChatList.

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[CONVERSATION_LEAVE_DELETE]", err);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
