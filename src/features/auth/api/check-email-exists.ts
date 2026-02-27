import { supabase } from '@/supabase/client'

/**
 * Checks if an email is already registered in the system securely via RPC.
 * Useful for preventing "silently failed" sign-ups without leaking user discovery natively via GoTrue.
 */
export async function checkEmailExists(email: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('check_email_exists', {
    p_email: email,
  })

  if (error) throw error
  return data
}
