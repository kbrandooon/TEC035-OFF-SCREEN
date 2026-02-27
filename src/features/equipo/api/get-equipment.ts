import { supabase } from '@/supabase/client'
import type { Equipment } from '../types'

/**
 * Fetches all equipment for the current tenant, ordered by name.
 * @returns Array of Equipment records.
 */
export async function getEquipment(): Promise<Equipment[]> {
  const { data, error } = await supabase
    .from('equipment')
    .select('id, tenant_id, name, description, type, status, quantity, created_at, created_by, updated_at, updated_by')
    .order('name')

  if (error) throw new Error(error.message)
  return data ?? []
}
