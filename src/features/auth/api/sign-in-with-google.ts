import { supabase } from '@/supabase/client'
import type { SignupRole } from './sign-up-with-email'

/**
 * sessionStorage key used to bridge the selected role across the Google
 * OAuth redirect. Written before the redirect, consumed and deleted after.
 */
export const PENDING_ROLE_KEY = 'pending_signup_role'

/**
 * Initiates Google OAuth sign-in.
 *
 * The `role` is saved to sessionStorage before redirecting so it survives
 * the Google → app round-trip. The caller is responsible for reading and
 * applying it after the OAuth callback lands.
 *
 * @param role - Account type the user selected on the signup toggle.
 */
export async function signInWithGoogle(role?: SignupRole) {
  if (role) {
    sessionStorage.setItem(PENDING_ROLE_KEY, role)
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/`,
    },
  })
  if (error) throw error
  return data
}
