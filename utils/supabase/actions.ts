'use server'

import { createClient } from './server'
import { prisma } from '@/lib/prisma'

export async function signUp(
  email: string,
  password: string,
  username: string,
  isPublic: boolean
) {
  const supabase = await createClient()

  // Check username not already taken
  const existing = await prisma.user.findUnique({ where: { username } })
  if (existing) {
    return { error: { message: 'Username already taken' } }
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: undefined
    }
  })
  if (error || !data.user) return { error }

  // Create user row in our DB
  await prisma.user.create({
    data: {
      id: data.user.id,
      email,
      username,
      isPrivate: !isPublic,
    }
  })

  return { error: null }
}

export async function signInWithPassword(email: string, password: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  return { error }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
}

export async function getSession() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}
