import { supabase } from '@/supabase/client'
import type { Reservation } from '../types'

/**
 * Fetches all reservations for the current tenant, ordered by start date desc.
 *
 * Queries the `v_reservations` view, which pre-joins the `customers` table so
 * the API layer never needs to use PostgREST lateral joins or runtime type casts.
 *
 * @returns An array of {@link Reservation} records with `clientName` populated.
 */
export async function getReservations(): Promise<Reservation[]> {
  const { data, error } = await supabase
    .from('v_reservations')
    .select(
      'id, tenant_id, date, end_date, start_time, end_time, customer_id, customer_names, customer_last_name, address, notes, requires_invoice, equipment_items, status, created_at'
    )
    .order('date', { ascending: false })

  if (error) throw new Error(error.message)

  // Map snake_case view columns → camelCase domain types
  return (data ?? []).map((row) => ({
    id: row.id,
    tenant_id: row.tenant_id,
    date: row.date,
    endDate: row.end_date ?? row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    clientId: row.customer_id,
    // Customer name is denormalized by the view — no runtime branching required
    clientName: row.customer_names
      ? `${row.customer_names} ${row.customer_last_name ?? ''}`.trim()
      : '',
    address: row.address,
    notes: row.notes ?? '',
    requiresInvoice: row.requires_invoice ?? false,
    equipmentItems: row.equipment_items ?? [],
    status: (row.status ?? 'pending') as 'pending' | 'confirmed' | 'canceled',
    created_at: row.created_at,
  }))
}
