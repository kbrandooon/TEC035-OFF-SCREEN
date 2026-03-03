import { supabase } from '@/supabase/client'
import type { Customer, CustomerFormValues } from '../types'

/**
 * Updates an existing customer by ID.
 * @param id - The UUID of the customer to update.
 * @param values - Partial customer fields to apply.
 * @returns The updated Customer record.
 */
export async function updateClient(
  id: string,
  values: Partial<CustomerFormValues>
): Promise<Customer> {
  const { data, error } = await supabase
    .from('customers')
    .update({
      names: values.names,
      last_name: values.last_name,
      email: values.email ?? null,
      phone: values.phone ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select(
      'id, tenant_id, names, last_name, email, phone, created_at, created_by, updated_at, updated_by'
    )
    .single()

  if (error) throw new Error(error.message)
  return data
}
