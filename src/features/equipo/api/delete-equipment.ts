import { supabase } from '@/supabase/client'

/**
 * Deletes an equipment item by ID.
 * @param id - UUID of the equipment to delete.
 */
export async function deleteEquipment(id: string): Promise<void> {
  const { error } = await supabase.from('equipment').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
