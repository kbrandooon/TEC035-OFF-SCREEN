import { supabase } from '@/supabase/client'

/**
 * Deletes a customer by ID. Supabase RLS ensures only tenant-owned records are affected.
 * @param id - The UUID of the customer to delete.
 */
export async function deleteClient(id: string): Promise<void> {
  const { error } = await supabase.from('customers').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
