/** Equipment status values as stored in the DB. */
export type EquipmentStatus = 'available' | 'maintenance' | 'retired'

/** Represents an equipment record from the `equipment` table. */
export interface Equipment {
  id: string
  tenant_id: string
  name: string
  description: string | null
  type: string
  status: EquipmentStatus
  quantity: number
  created_at: string
  created_by: string | null
  updated_at: string | null
  updated_by: string | null
}

/** Input shape for creating or updating equipment. */
export interface EquipmentFormValues {
  name: string
  description: string
  type: string
  status: EquipmentStatus
  quantity: number
}
