import { supabase } from '@/supabase/client'

/**
 * Sign in using email and password.
 *
 * @param email - User's email address.
 * @param password - User's password.
 * @returns The session and user details on success.
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error
  return data
}
