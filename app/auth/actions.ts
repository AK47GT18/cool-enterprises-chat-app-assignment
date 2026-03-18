'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

import { signJWT } from '@/lib/jwt';

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.hashedPassword) {
    return { error: 'Invalid email or password' };
  }

  const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);

  if (!isPasswordValid) {
    return { error: 'Invalid email or password' };
  }

  const token = await signJWT({ userId: user.id, email: user.email });

  const cookieStore = await cookies();
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  revalidatePath('/', 'layout');
  redirect('/');
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const username = formData.get('username') as string;
  const isPublic = formData.get('isPublic') === 'true';

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email },
        { username }
      ]
    }
  });

  if (existingUser) {
    return { error: 'User with this email or username already exists' };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      username,
      hashedPassword,
      isPrivate: !isPublic,
    }
  });

  const token = await signJWT({ userId: user.id, email: user.email });

  const cookieStore = await cookies();
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  revalidatePath('/', 'layout');
  redirect('/');
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('session');

  revalidatePath('/', 'layout');
  redirect('/auth/login');
}

export async function resetPassword(formData: FormData) {
  const token = formData.get('token') as string;
  const password = formData.get('password') as string;

  if (!token || !password) {
    return { error: 'Invalid request' };
  }

  const resetToken = await (prisma as any).passwordResetToken.findUnique({
    where: { token }
  });

  if (!resetToken || resetToken.expiresAt < new Date()) {
    return { error: 'Invalid or expired token' };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { email: resetToken.email },
    data: { hashedPassword }
  });

  await (prisma as any).passwordResetToken.delete({
    where: { token }
  });

  return { success: true };
}
