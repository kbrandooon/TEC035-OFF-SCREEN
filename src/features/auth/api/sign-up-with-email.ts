import { supabase } from '@/supabase/client'

/**
 * Sign up a new user with an email and password.
 */
export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  if (error) throw error
  return data
}
