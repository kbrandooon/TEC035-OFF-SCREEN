import { supabase } from '@/supabase/client'
import type { EquipmentAvailabilityResult } from '@/features/equipo-disponibilidad'

/**
 * Availability for the public `/reserve/:slug` flow.
 * Uses SECURITY DEFINER RPC so callers without tenant/cliente RLS still get
 * correct committed counts for that studio only.
 */
export async function getEquipmentAvailabilityForReserveSlug(
  tenantSlug: string,
  start: string,
  end: string,
  type?: string
): Promise<EquipmentAvailabilityResult[]> {
  const { data, error } = await supabase.rpc(
    'get_equipment_availability_for_reserve_slug',
    {
      p_slug: tenantSlug,
      p_start: start,
      p_end: end,
      p_type: type ?? null,
    }
  )

  if (error) throw error

  return (data ?? []) as EquipmentAvailabilityResult[]
}
