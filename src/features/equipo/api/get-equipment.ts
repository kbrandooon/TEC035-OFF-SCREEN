import { supabase } from '@/supabase/client'
import type { Equipment, EquipmentStatus, EquipmentType } from '../types'

const PAGE_SIZE = 15

export interface GetEquipmentParams {
  /** 1-based page number. */
  page: number
  search?: string
  status?: EquipmentStatus | null
  type?: EquipmentType | null
}

export interface GetEquipmentResult {
  data: Equipment[]
  /** Total rows matching the current filters (for pagination). */
  total: number
}

/**
 * Fetches a paginated, filtered page of equipment for the current tenant.
 * Uses Supabase `.range()` so only {@link PAGE_SIZE} rows are transferred per call.
 * @param params - Pagination and filter parameters.
 * @param params.page - 1-based page index.
 * @param params.search - Optional keyword: matched against name and description.
 * @param params.status - Optional availability status filter.
 * @param params.type - Optional equipment category filter.
 * @returns Paginated list of equipment and the total matching row count.
 */
export async function getEquipment(
  params: GetEquipmentParams
): Promise<GetEquipmentResult> {
  const { page, search, status, type } = params
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from('equipment')
    .select(
      'id, tenant_id, name, description, type, status, quantity, daily_rate, image_url, created_at, created_by, updated_at, updated_by',
      { count: 'exact' }
    )
    .order('name')
    .range(from, to)

  // Search by name and description only (type uses its own dedicated filter)
  if (search?.trim()) {
    const q = search.trim()
    query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`)
  }

  if (status) query = query.eq('status', status)
  if (type) query = query.eq('type', type)

  const { data, error, count } = await query

  if (error) throw new Error(error.message)
  return { data: data ?? [], total: count ?? 0 }
}

export { PAGE_SIZE }
