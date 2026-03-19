import { NextResponse } from 'next/server';
import { SessionService } from '@/services/session.service';
import { prisma } from '@/lib/prisma';
import { EmailService } from '@/services/email.service';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { user, error: authError } = await SessionService.requireAuth();
    if (authError) return authError;

    const { groupId } = await params;
    const { email } = await req.json();

    const group = await prisma.conversation.findUnique({
      where: { id: groupId, isGroup: true },
      include: { members: true }
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const isAdmin = group.members.find(m => 
      m.userId === user.id && 
      (m.role === 'ADMIN' || m.role === 'SUPER_ADMIN')
    );
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const userToInvite = await prisma.user.findUnique({ where: { email } });
    if (!userToInvite) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isAlreadyMember = group.members.some(m => m.userId === userToInvite.id);
    if (isAlreadyMember) {
      return NextResponse.json({ error: 'User is already in the group' }, { status: 400 });
    }

    await prisma.userConversation.create({
      data: {
        userId: userToInvite.id,
        conversationId: groupId,
        role: 'MEMBER'
      }
    });

    return NextResponse.json({ message: 'User invited' });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
