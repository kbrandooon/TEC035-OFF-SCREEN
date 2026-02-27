import { supabase } from '@/supabase/client'

/**
 * Fetches all pending (not yet accepted, not expired) invitations for the active tenant.
 */
export async function getPendingInvitations() {
  const { data, error } = await supabase.rpc('get_pending_invitations')
  if (error) throw new Error(error.message)
  return data ?? []
}
