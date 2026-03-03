import { supabase } from '@/supabase/client'
import type { EquipmentType } from '../types'

/** Per-type stock summary used by the inventory status widget. */
export interface EquipmentTypeStat {
  /** Equipment category. */
  type: EquipmentType
  /**
   * Units available **today** — total quantity minus units committed in
   * reservations that overlap the current moment through end of today.
   * Floored at 0.
   */
  available: number
  /** Total units across all active statuses. */
  total: number
}

/**
 * Returns per-type equipment availability for **today**.
 *
 * Calls the `get_today_equipment_stats` RPC which subtracts actively committed
 * units (reservations overlapping [now, end_of_today]) from total stock.
 * This replaces the previous `v_equipment_stats` view query that only used
 * the static `status = 'disponible'` flag without considering reservations.
 *
 * @returns Array of per-type live availability stats, sorted by type.
 */
export async function getEquipmentStats(): Promise<EquipmentTypeStat[]> {
  const { data, error } = await supabase.rpc('get_today_equipment_stats')

  if (error) throw new Error(error.message)
  if (!data || data.length === 0) return []

  return data.map(
    (row: { type: string; total: number; today_available: number }) => ({
      type: row.type as EquipmentType,
      total: Number(row.total ?? 0),
      available: Number(row.today_available ?? 0),
    })
  )
}
