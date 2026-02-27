import { supabase } from '@/supabase/client'
import type { InventoryMovement, InventoryFormValues } from '../types'

/**
 * Creates a new inventory movement record.
 * @param values - The form data for the new movement.
 * @returns The newly created InventoryMovement record.
 */
export async function createInventoryMovement(
  values: InventoryFormValues
): Promise<InventoryMovement> {
  const { data, error } = await supabase
    .from('inventory')
    .insert({
      equipment_id: values.equipment_id,
      date: values.date,
      movement_type: values.movement_type,
      quantity: values.quantity,
      clasification: values.clasification || null,
      description: values.description || null,
    })
    .select('id, tenant_id, equipment_id, date, movement_type, quantity, clasification, description, created_at, created_by')
    .single()

  if (error) throw new Error(error.message)
  return data
}
