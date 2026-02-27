import { supabase } from '@/supabase/client'

/**
 * Fetches all active employees (tenant_members with profiles) for the active tenant.
 */
export async function getTenantEmployees() {
  const { data, error } = await supabase.rpc('get_tenant_employees')
  if (error) throw new Error(error.message)
  return data ?? []
}
