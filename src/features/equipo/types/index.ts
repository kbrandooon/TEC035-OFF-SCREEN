/** Equipment type values matching the `equipment_type` Postgres enum. */
export type EquipmentType =
  | 'camara'
  | 'lente'
  | 'iluminacion'
  | 'tramoya'
  | 'audio'
  | 'video'
  | 'estudio'
  | 'otros_accesorios'

/** Equipment status values matching the `equipment_status` Postgres enum. */
export type EquipmentStatus = 'disponible' | 'mantenimiento' | 'no_disponible'

/** Represents an equipment record from the `equipment` table. */
export interface Equipment {
  id: string
  tenant_id: string
  name: string
  description: string | null
  type: EquipmentType
  status: EquipmentStatus
  quantity: number
  image_url: string | null
  created_at: string
  created_by: string | null
  updated_at: string | null
  updated_by: string | null
}

/** Input shape for creating or updating equipment. */
export interface EquipmentFormValues {
  name: string
  description: string
  type: EquipmentType
  status: EquipmentStatus
  image_url: string | null
}
