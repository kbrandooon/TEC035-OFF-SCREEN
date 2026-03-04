/** Allowed reservation status values. */
export type ReservationStatus = 'pending' | 'confirmed' | 'canceled'

/** A single equipment item added to a reservation. */
export interface ReservationEquipmentItem {
  equipmentId: string
  name: string
  quantity: number
  daily_rate: number
  image_url: string | null
}

/** Input shape for creating or updating a reservation. */
export interface ReservationFormValues {
  date: string // ISO date string YYYY-MM-DD  (Fecha de Inicio)
  endDate: string // ISO date string YYYY-MM-DD  (Fecha de Fin)
  startTime: string // HH:MM (24h)
  endTime: string // HH:MM (24h)
  clientId: string
  clientName: string // denormalized for preview
  address: string
  notes: string
  requiresInvoice: boolean
  equipmentItems: ReservationEquipmentItem[]
}

/** Represents a reservation record. */
export interface Reservation extends ReservationFormValues {
  id: string
  tenant_id: string
  created_at: string
  status: ReservationStatus
  /** Populated for client-originated reservations when customer_id is empty. */
  clientProfileId?: string
}
