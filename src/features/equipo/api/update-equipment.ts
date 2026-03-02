import { supabase } from '@/supabase/client'
import type { Equipment, EquipmentFormValues } from '../types'

/**
 * Updates an existing equipment item by ID.
 * @param id - UUID of the equipment to update.
 * @param values - Partial fields to apply.
 * @returns The updated Equipment record.
 */
export async function updateEquipment(
  id: string,
  values: Partial<EquipmentFormValues>
): Promise<Equipment> {
  const { data, error } = await supabase
    .from('equipment')
    .update({
      name: values.name,
      description: values.description ?? null,
      type: values.type,
      status: values.status,
      image_url: values.image_url ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select(
      'id, tenant_id, name, description, type, status, quantity, image_url, created_at, created_by, updated_at, updated_by'
    )
    .single()

  if (error) throw new Error(error.message)
  return data
}
