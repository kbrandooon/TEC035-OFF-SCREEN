/** Movement types as stored in the `inventory` table. */
export type MovementType = 'in' | 'out' | 'adjustment'

/** Represents a stock movement record from the `inventory` table. */
export interface InventoryMovement {
  id: string
  tenant_id: string
  equipment_id: string
  equipment_name?: string
  date: string
  movement_type: MovementType
  quantity: number
  clasification: string | null
  description: string | null
  created_at: string
  created_by: string | null
}

/** Input shape for creating an inventory movement. */
export interface InventoryFormValues {
  equipment_id: string
  date: string
  movement_type: MovementType
  quantity: number
  clasification: string
  description: string
}
