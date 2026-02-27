import { supabase } from '@/supabase/client'
import type { UserAttributes } from '@supabase/supabase-js'

/**
 * Updates the current user attributes (like password).
 */
export async function updateUser(attributes: UserAttributes) {
  const { data, error } = await supabase.auth.updateUser(attributes)
  if (error) throw error
  return data
}
