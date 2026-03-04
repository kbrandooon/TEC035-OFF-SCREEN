/**
 * Shared domain types for the cliente-portal feature.
 */

/** Equipment row enriched with its tenant (studio) name for marketplace display. */
export interface MarketplaceEquipment {
  id: string
  name: string
  type: string
  description: string | null
  daily_rate: number
  status: 'disponible' | 'mantenimiento' | 'no_disponible'
  image_url: string | null
  tenant_id: string
  tenant_name: string
}

/**
 * A single item in the client's cart.
 * Price is calculated client-side from `daily_rate × days`
 */
export interface CartItem {
  equipment: MarketplaceEquipment
  /** ISO date string (YYYY-MM-DD) */
  startDate: string
  /** ISO date string (YYYY-MM-DD) */
  endDate: string
  /** HH:MM – start time of the rental */
  startTime: string
  /** HH:MM – end time of the rental */
  endTime: string
  /** Number of rental days (endDate − startDate, minimum 1) */
  days: number
  /** daily_rate × days */
  subtotal: number
}
