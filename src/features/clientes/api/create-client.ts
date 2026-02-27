import { supabase } from '@/supabase/client'
import type { Customer, CustomerFormValues } from '../types'

/**
 * Creates a new customer record for the current tenant.
 * @param values - The form data for the new customer.
 * @returns The newly created Customer record.
 */
export async function createClient(values: CustomerFormValues): Promise<Customer> {
  const { data, error } = await supabase
    .from('customers')
    .insert({
      names: values.names,
      last_name: values.last_name,
      email: values.email || null,
      phone: values.phone || null,
    })
    .select('id, tenant_id, names, last_name, email, phone, created_at, created_by, updated_at, updated_by')
    .single()

  if (error) throw new Error(error.message)
  return data
}
