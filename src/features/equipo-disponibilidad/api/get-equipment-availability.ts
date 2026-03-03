import { supabase } from '@/supabase/client'
import type { EquipmentAvailabilityResult } from '../types'

/**
 * Calls the `get_equipment_availability` Supabase RPC to calculate
 * how many units of each equipment item are available in the given window.
 *
 * Uses the `&&` tsrange overlap operator at the DB level to detect conflicts.
 *
 * @param start - ISO 8601 datetime for the start of the inquiry window.
 * @param end   - ISO 8601 datetime for the end of the inquiry window.
 * @param type  - Optional: filter results to a single equipment type.
 * @returns Array of availability rows, one per active equipment item.
 */
export async function getEquipmentAvailability(
  start: string,
  end: string,
  type?: string
): Promise<EquipmentAvailabilityResult[]> {
  const { data, error } = await supabase.rpc('get_equipment_availability', {
    p_start: start,
    p_end: end,
    ...(type ? { p_type: type } : {}),
  })

  if (error) throw error

  return (data ?? []) as EquipmentAvailabilityResult[]
}
