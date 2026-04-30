import { supabase } from '@/supabase/client'
import type { SignupRole } from './sign-up-with-email'

/**
 * sessionStorage key used to bridge the selected role across the Google
 * OAuth redirect. Written before the redirect, consumed and deleted after.
 */
export const PENDING_ROLE_KEY = 'pending_signup_role'

/** Options for Google OAuth beyond the optional signup role. */
export interface SignInWithGoogleOptions {
  /**
   * App-only path to return to after OAuth (e.g. `/reserve/acme-studio`).
   * Must pass {@link isSafeInternalOAuthRedirectPath}; otherwise falls back to `/`.
   */
  redirectPath?: string
}

/**
 * Returns true if `path` is a same-origin relative path we allow for OAuth
 * return (prevents open redirects).
 */
export function isSafeInternalOAuthRedirectPath(path: string): boolean {
  if (!path.startsWith('/') || path.startsWith('//')) return false
  if (path.includes('://') || path.includes('\\')) return false
  // `/reserve/:slug` — slug: letters, digits, dot, hyphen
  return /^\/reserve\/[\w.-]+\/?$/.test(path)
}

function resolveOAuthRedirectUrl(options?: SignInWithGoogleOptions): string {
  const origin = window.location.origin
  const path = options?.redirectPath?.trim()
  if (path && isSafeInternalOAuthRedirectPath(path)) {
    const normalized = path.endsWith('/') ? path.slice(0, -1) : path
    return `${origin}${normalized}`
  }
  return `${origin}/`
}

/**
 * Initiates Google OAuth sign-in.
 *
 * The `role` is saved to sessionStorage before redirecting so it survives
 * the Google → app round-trip. The caller is responsible for reading and
 * applying it after the OAuth callback lands.
 *
 * @param role - Account type the user selected on the signup toggle.
 * @param options - Optional `redirectPath` for post-OAuth return (allowlisted).
 */
export async function signInWithGoogle(
  role?: SignupRole,
  options?: SignInWithGoogleOptions
) {
  if (role) {
    sessionStorage.setItem(PENDING_ROLE_KEY, role)
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: resolveOAuthRedirectUrl(options),
    },
  })
  if (error) throw error
  return data
}
