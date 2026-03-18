import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/jwt';

export const SessionService = {
  /**
   * Get the currently authenticated user from the session cookie.
   */
  async getCurrentUser() {
    try {
      const cookieStore = await cookies();
      const sessionToken = cookieStore.get('session')?.value;

      if (!sessionToken) return null;

      const payload = await verifyJWT(sessionToken);
      const userId = payload?.userId as string;

      if (!userId) return null;

      return await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          image: true,
          isPrivate: true,
          createdAt: true,
        },
      });
    } catch (e) {
      console.error("SessionService: Error getting current user", e);
      return null;
    }
  },

  /**
   * Helper to quickly return an Unauthorized response if not logged in.
   */
  async requireAuth() {
    const user = await this.getCurrentUser();
    if (!user) {
      return { 
        user: null, 
        error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) 
      };
    }
    return { user, error: null };
  }
};
