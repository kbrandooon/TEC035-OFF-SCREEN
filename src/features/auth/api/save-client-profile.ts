import { supabase } from '@/supabase/client'

/**
 * Upserts the client profile for the currently authenticated user
 * by calling the `save_client_profile` Postgres RPC.
 *
 * @param firstName - Client's first name.
 * @param lastName  - Client's last name.
 * @param phone     - Client's phone number (optional).
 */
export async function saveClientProfile(
  firstName: string,
  lastName: string,
  phone?: string
) {
  const { error } = await supabase.rpc('save_client_profile', {
    p_first_name: firstName,
    p_last_name: lastName,
    p_phone: phone ?? null,
  })
  if (error) throw error
}
