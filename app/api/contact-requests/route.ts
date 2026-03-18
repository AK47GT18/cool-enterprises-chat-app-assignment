import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = await createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requests = await prisma.contactRequest.findMany({
      where: {
        receiverId: user.id,
        status: 'PENDING',
      },
      include: {
        sender: {
          select: {
            username: true,
            image: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      }
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("[CONTACT_REQUESTS_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = await createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { receiverId, privacyCode } = await req.json();

    let targetUserId = receiverId;

    // If privacy code is provided, look up user by code
    if (privacyCode) {
      const targetUser = await prisma.user.findUnique({
        where: { privacyCode }
      });
      if (!targetUser) {
        return NextResponse.json({ error: "Invalid privacy code" }, { status: 404 });
      }
      targetUserId = targetUser.id;
    }

    if (!targetUserId) {
      return NextResponse.json({ error: "Receiver ID or privacy code is required" }, { status: 400 });
    }

    const existingRequest = await prisma.contactRequest.findFirst({
      where: {
        OR: [
          { senderId: user.id, receiverId: targetUserId },
          { senderId: targetUserId, receiverId: user.id },
        ]
      }
    });

    if (existingRequest) {
      return NextResponse.json({ error: "Request already exists" }, { status: 400 });
    }

    const request = await prisma.contactRequest.create({
      data: {
        senderId: user.id,
        receiverId: targetUserId,
      }
    });

    return NextResponse.json(request);
  } catch (error) {
    console.error("[CONTACT_REQUESTS_POST]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = await createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { requestId, status } = await req.json();

    if (!['ACCEPTED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const request = await prisma.contactRequest.findUnique({
      where: { id: requestId },
      include: { sender: true, receiver: true }
    });

    if (!request || request.receiverId !== user.id) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    }

    const updatedRequest = await prisma.contactRequest.update({
      where: { id: requestId },
      data: { status }
    });

    if (status === 'ACCEPTED') {
      // Create conversation
      await prisma.conversation.create({
        data: {
          members: {
            create: [
              { userId: request.senderId },
              { userId: request.receiverId }
            ]
          }
        }
      });
    }

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error("[CONTACT_REQUESTS_PATCH]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
