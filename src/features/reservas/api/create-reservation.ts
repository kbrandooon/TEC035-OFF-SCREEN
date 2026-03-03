import { supabase } from '@/supabase/client'
import type { ReservationFormValues } from '../types'

/**
 * Creates a new reservation record in the `reservations` table.
 *
 * @param values - Validated form values.
 * @returns The newly created reservation id.
 */
export async function createReservation(
  values: ReservationFormValues
): Promise<string> {
  const { data, error } = await supabase
    .from('reservations')
    .insert({
      date: values.date,
      end_date: values.endDate,
      start_time: values.startTime,
      end_time: values.endTime,
      customer_id: values.clientId,
      address: values.address,
      notes: values.notes,
      requires_invoice: values.requiresInvoice,
      equipment_items: values.equipmentItems,
      status: 'pending',
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  return data.id
}
