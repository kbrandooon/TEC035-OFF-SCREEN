import { supabase } from '@/supabase/client'
import type { InventoryMovement, MovementType } from '../types'

/** Number of rows per page returned by {@link getInventory}. */
export const PAGE_SIZE = 10

/** Filter and pagination parameters for {@link getInventory}. */
export interface GetInventoryParams {
  /** 1-based page number. */
  page: number
  /** ISO date string (YYYY-MM-DD) — movements on or after this date. */
  dateFrom?: string
  /** ISO date string (YYYY-MM-DD) — movements on or before this date. */
  dateTo?: string
  /** Filter by movement type. */
  movementType?: MovementType
  /** Case-insensitive partial match on the clasification field. */
  clasification?: string
}

/** Return shape for {@link getInventory}. */
export interface GetInventoryResult {
  data: InventoryMovement[]
  /** Total rows matching current filters (for pagination). */
  total: number
}

/**
 * Fetches a paginated, filtered page of inventory movements with equipment name.
 *
 * Queries the `v_inventory_movements` view, which pre-joins the `equipment`
 * table so the API layer receives `equipment_name` as a plain column —
 * no PostgREST joins or unsafe `as unknown` casts required.
 *
 * Filters and pagination are applied at the SQL level via `.range()`, so only
 * {@link PAGE_SIZE} rows are transferred per call.
 *
 * @param params - Pagination and filter parameters.
 * @returns Paginated list of inventory movements and the total matching row count.
 */
export async function getInventory({
  page,
  dateFrom,
  dateTo,
  movementType,
  clasification,
}: GetInventoryParams): Promise<GetInventoryResult> {
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from('v_inventory_movements')
    .select(
      'id, tenant_id, equipment_id, equipment_name, date, movement_type, quantity, clasification, description, created_at, created_by',
      { count: 'exact' }
    )
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (dateFrom) query = query.gte('date', dateFrom)
  if (dateTo) query = query.lte('date', dateTo)
  if (movementType) query = query.eq('movement_type', movementType)
  if (clasification) query = query.ilike('clasification', `%${clasification}%`)

  const { data, error, count } = await query

  if (error) throw new Error(error.message)

  return {
    data: (data ?? []).map((row) => ({
      id: row.id,
      tenant_id: row.tenant_id,
      equipment_id: row.equipment_id,
      // `equipment_name` is a plain view column — no type cast needed
      equipment_name: row.equipment_name ?? undefined,
      date: row.date,
      movement_type: row.movement_type,
      quantity: row.quantity,
      clasification: row.clasification,
      description: row.description,
      created_at: row.created_at,
      created_by: row.created_by,
    })),
    total: count ?? 0,
  }
}
