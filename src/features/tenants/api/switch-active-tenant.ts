import { supabase } from '@/supabase/client'

/**
 * Switches the authenticated user's active tenant by updating JWT app_metadata.
 * After calling this, you must call `supabase.auth.refreshSession()` to obtain
 * a new JWT with the updated `tenant_id` claim.
 *
 * @param tenantId - The UUID of the tenant to switch to.
 * @throws If the user does not belong to the specified tenant.
 */
export async function switchActiveTenant(tenantId: string) {
  const { error } = await supabase.rpc('switch_active_tenant', {
    p_tenant_id: tenantId,
  })

  if (error) throw new Error(error.message)
}
