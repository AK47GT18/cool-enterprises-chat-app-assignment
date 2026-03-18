import { NextResponse } from 'next/server';
import { SessionService } from '@/services/session.service';
import { prisma } from '@/lib/prisma';
import { EmailService } from '@/services/email.service';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { user, errorResponse } = await SessionService.requireAuth();
    if (errorResponse) return errorResponse;

    const { groupId } = await params;
    const { email } = await req.json();

    if (!email) return new NextResponse("Email required", { status: 400 });

    const group = await prisma.conversation.findUnique({
      where: { id: groupId, isGroup: true },
      include: {
        members: true
      }
    });

    if (!group) return new NextResponse("Group not found", { status: 404 });

    // Ensure the inviter is at least an admin
    const member = group.members.find(m => m.userId === user.id);
    if (!member || (member.role !== 'ADMIN' && member.role !== 'SUPER_ADMIN')) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Generate the join link
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const inviteLink = `${baseUrl}/groups/join/${group.inviteCode}`;

    const { success, error } = await EmailService.sendGroupInvite(
      email,
      group.name || "A Private Group",
      inviteLink,
      user?.username || "A Friend"
    );

    if (!success) {
      console.error("[GROUP_INVITE_EMAIL]", error);
      return new NextResponse("Failed to dispatch email", { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[GROUP_INVITE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
