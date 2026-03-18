import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SessionService } from '@/services/session.service';

export async function POST(req: Request) {
  try {
    const { user, error } = await SessionService.requireAuth();
    if (error) return error;

    const { inviteCode } = await req.json();

    if (!inviteCode) {
      return NextResponse.json({ error: "Invite code is required" }, { status: 400 });
    }

    // Find the group by invite code
    const conversation = await prisma.conversation.findUnique({
      where: { inviteCode },
      include: {
        members: true
      }
    });

    if (!conversation) {
      return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
    }

    if (!conversation.isGroup) {
      return NextResponse.json({ error: "This is not a group" }, { status: 400 });
    }

    // Check if user is already a member
    const existingMember = conversation.members.find(m => m.userId === user.id);
    if (existingMember) {
      return NextResponse.json({ error: "You are already a member of this group" }, { status: 400 });
    }

    // Add user as member
    await prisma.userConversation.create({
      data: {
        userId: user.id,
        conversationId: conversation.id,
        role: 'MEMBER'
      }
    });

    return NextResponse.json({ success: true, conversationId: conversation.id, name: conversation.name });
  } catch (error) {
    console.error("[GROUPS_JOIN]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
