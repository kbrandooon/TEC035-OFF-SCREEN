import { supabase } from '@/supabase/client'

/**
 * Completes the invitation flow after the user has signed up.
 * Links the authenticated user to the tenant and updates their profile.
 *
 * @param token     - UUID invitation token.
 * @param firstName - User's first name.
 * @param lastName  - User's last name.
 * @param phone     - User's phone (optional, pass empty string if none).
 */
export async function acceptInvitation(
  token: string,
  firstName: string,
  lastName: string,
  phone: string
) {
  const { error } = await supabase.rpc('accept_invitation', {
    p_token: token,
    p_first_name: firstName,
    p_last_name: lastName,
    p_phone: phone,
  })
  if (error) throw new Error(error.message)
}
