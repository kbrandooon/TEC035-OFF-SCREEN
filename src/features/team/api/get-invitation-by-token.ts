import { supabase } from '@/supabase/client'

/**
 * Fetches invitation metadata for a given token (public, no auth required).
 *
 * @param token - UUID token from the invitation email link.
 * @returns Invitation row or `null` if not found.
 */
export async function getInvitationByToken(token: string) {
  const { data, error } = await supabase.rpc('get_invitation_by_token', {
    p_token: token,
  })
  if (error) throw new Error(error.message)
  return data?.[0] ?? null
}
