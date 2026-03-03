import { supabase } from '@/supabase/client'
import type { InventoryFormValues, InventoryMovement } from '../types'

/** Updates an existing inventory movement record. Returns the updated row. */
export async function updateInventoryMovement(
  id: string,
  values: Partial<InventoryFormValues>
): Promise<InventoryMovement> {
  const { data, error } = await supabase
    .from('inventory')
    .update(values)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as InventoryMovement
}
