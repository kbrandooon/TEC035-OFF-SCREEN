import { supabase } from '@/supabase/client'
import type { InventoryMovement } from '../types'

/**
 * Fetches all inventory movements for the current tenant, joined with equipment name.
 * @returns Array of InventoryMovement records ordered by date descending.
 */
export async function getInventory(): Promise<InventoryMovement[]> {
  const { data, error } = await supabase
    .from('inventory')
    .select('id, tenant_id, equipment_id, date, movement_type, quantity, clasification, description, created_at, created_by, equipment(name)')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  return (data ?? []).map((row) => ({
    id: row.id,
    tenant_id: row.tenant_id,
    equipment_id: row.equipment_id,
    equipment_name: (row.equipment as unknown as { name: string } | null)?.name,
    date: row.date,
    movement_type: row.movement_type,
    quantity: row.quantity,
    clasification: row.clasification,
    description: row.description,
    created_at: row.created_at,
    created_by: row.created_by,
  }))
}
