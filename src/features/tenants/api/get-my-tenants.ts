import { supabase } from '@/supabase/client'

/**
 * Fetches all tenants (studios) the authenticated user belongs to.
 *
 * @returns An array of tenant objects `{ id, name, slug, created_at }`.
 */
export async function getMyTenants() {
  const { data, error } = await supabase.rpc('get_my_tenants')

  if (error) throw new Error(error.message)

  return data ?? []
}
