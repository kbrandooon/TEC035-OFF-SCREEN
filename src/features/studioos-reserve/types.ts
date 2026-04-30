/**
 * Payload produced when the user submits a public reservation request.
 * TODO: POST to CRM (Lead + Opportunity) or studio API when tables exist.
 */
export type ReserveRentalKind = 'estudio' | 'equipo'

export interface PublicReservationRequestPayload {
  tenantSlug: string
  tenantId: string
  tenantName: string
  /** Lo elegido en el paso 1 (estudio vs resto de equipo). */
  rentalKind: ReserveRentalKind
  equipmentIds: string[]
  /** ISO-like local datetime strings as sent to `get_equipment_availability` (YYYY-MM-DDTHH:mm). */
  windowStart: string
  windowEnd: string
  contactName: string
  contactEmail: string
  contactPhone: string
  companyName?: string
  paxCount: number
  requiresInvoice: boolean
  budget?: number
  notes: string
  /** Source of the lead: 'whatsapp', 'instagram', or 'web'. */
  source: 'whatsapp' | 'instagram' | 'web'
  /** Authenticated user id for audit (optional). */
  submittedByUserId?: string
}
