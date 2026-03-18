"use server";

import { createClient } from "./server";
import { cookies } from "next/headers";

export async function signInWithPassword(email: string, password: string) {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { data, error };
}

export async function signUp(email: string, password: string, username: string, isPublic: boolean) {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        is_public: isPublic,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  return { data, error };
}

export async function signOut() {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);
  await supabase.auth.signOut();
}
