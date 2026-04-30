/**
 * A single row returned by the `get_equipment_availability` RPC.
 * Represents stock vs. committed status for one equipment item in a datetime window.
 */
export interface EquipmentAvailabilityResult {
  /** Equipment UUID. */
  id: string
  /** Display name. */
  name: string
  /** Equipment category type. */
  type: string
  /** Total units owned (quantity on record). */
  quantity: number
  /** Units committed (occupied) in the queried window. */
  committed: number
  /** Units available = quantity - committed (floored at 0). */
  available: number
  /** Optional equipment photo URL from Supabase Storage. */
  image_url?: string | null
}

/**
 * Filters applied to the Disponibilidad de Equipos panel.
 * Start and end datetimes are required to trigger the RPC.
 */
export interface EquipmentAvailabilityFilters {
  /** ISO 8601 datetime string for the start of the inquiry window (required). */
  start: string
  /** ISO 8601 datetime string for the end of the inquiry window (required). */
  end: string
  /** Optional single equipment type to filter results. */
  type: string
}
