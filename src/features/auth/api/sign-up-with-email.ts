import { supabase } from '@/supabase/client'

/** Account type chosen by the user at registration time. */
export type SignupRole = 'cliente' | 'estudio'

/**
 * Sign up a new user with an email, password, and account role.
 *
 * The `role` is persisted in `user_metadata` so downstream logic
 * (post-signup modal, auth guards) can branch accordingly.
 *
 * @param email    - User's email address.
 * @param password - Plain-text password (min 6 chars).
 * @param role     - 'cliente' for renters, 'estudio' for studio admins.
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  role: SignupRole
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role },
    },
  })
  if (error) throw error
  return data
}
