import { supabase } from '@/supabase/client'
import type { Equipment, EquipmentFormValues } from '../types'

/**
 * Creates a new equipment record for the current tenant.
 * @param values - The form data for the new equipment item.
 * @returns The newly created Equipment record.
 */
export async function createEquipment(
  values: EquipmentFormValues
): Promise<Equipment> {
  const { data, error } = await supabase
    .from('equipment')
    .insert({
      name: values.name,
      description: values.description || null,
      type: values.type,
      status: values.status,
      daily_rate: values.daily_rate,
      image_url: values.image_url || null,
    })
    .select(
      'id, tenant_id, name, description, type, status, quantity, daily_rate, image_url, created_at, created_by, updated_at, updated_by'
    )
    .single()

  if (error) throw new Error(error.message)
  return data
}
