import { supabase } from '@/supabase/client'
import type { EquipmentType } from '../types'

/** Per-type stock summary used by the inventory status widget. */
export interface EquipmentTypeStat {
  /** Equipment category. */
  type: EquipmentType
  /** Units currently available (`status = 'disponible'`). */
  available: number
  /** Total units across all statuses. */
  total: number
}

/**
 * Returns per-type stock summaries for the current tenant's equipment.
 *
 * Queries the `v_equipment_stats` view, which performs a `GROUP BY type`
 * aggregation in Postgres. This replaces the previous client-side reduce loop
 * that fetched all rows and computed available/total counts in JavaScript.
 *
 * @returns Array of per-type stock summaries, sorted by type name.
 */
export async function getEquipmentStats(): Promise<EquipmentTypeStat[]> {
  const { data, error } = await supabase
    .from('v_equipment_stats')
    .select('type, total, available')
    .order('type')

  if (error) throw new Error(error.message)
  if (!data || data.length === 0) return []

  return data.map((row) => ({
    type: row.type as EquipmentType,
    // Postgres SUM returns numeric; coerce to number for domain type safety
    total: Number(row.total ?? 0),
    available: Number(row.available ?? 0),
  }))
}
