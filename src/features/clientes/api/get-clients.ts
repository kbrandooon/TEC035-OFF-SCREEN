import { supabase } from '@/supabase/client'
import type { Customer } from '../types'

/**
 * Fetches all customers for the current tenant, ordered by names.
 * @returns Array of Customer records.
 */
export async function getClients(): Promise<Customer[]> {
  const { data, error } = await supabase
    .from('customers')
    .select(
      'id, tenant_id, names, last_name, email, phone, created_at, created_by, updated_at, updated_by'
    )
    .order('names')

  if (error) throw new Error(error.message)
  return data ?? []
}
