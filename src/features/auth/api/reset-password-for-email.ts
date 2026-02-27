import { supabase } from '@/supabase/client'

/**
 * Resets a user's password via email.
 */
export async function resetPasswordForEmail(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email)
  if (error) throw error
}
