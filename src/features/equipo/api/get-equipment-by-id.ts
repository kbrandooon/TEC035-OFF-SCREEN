import { supabase } from '@/supabase/client'
import type { Equipment } from '../types'

/**
 * Fetches a single equipment item by its UUID.
 * @param id - UUID of the equipment to fetch.
 * @returns The Equipment record, or null if not found.
 */
export async function getEquipmentById(id: string): Promise<Equipment | null> {
  const { data, error } = await supabase
    .from('equipment')
    .select(
      'id, tenant_id, name, description, type, status, quantity, daily_rate, image_url, created_at, created_by, updated_at, updated_by'
    )
    .eq('id', id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}
