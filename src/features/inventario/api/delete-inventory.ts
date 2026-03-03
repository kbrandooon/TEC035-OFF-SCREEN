import { supabase } from '@/supabase/client'

/** Deletes an inventory movement record by ID. */
export async function deleteInventoryMovement(id: string): Promise<void> {
  const { error } = await supabase.from('inventory').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
