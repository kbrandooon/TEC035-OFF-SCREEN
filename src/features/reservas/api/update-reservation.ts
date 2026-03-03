import { supabase } from '@/supabase/client'
import type { ReservationFormValues } from '../types'

/**
 * Updates an existing reservation record.
 *
 * @param id     - UUID of the reservation to update.
 * @param values - New form values.
 */
export async function updateReservation(
  id: string,
  values: ReservationFormValues
): Promise<void> {
  const { error } = await supabase
    .from('reservations')
    .update({
      date: values.date,
      end_date: values.endDate,
      start_time: values.startTime,
      end_time: values.endTime,
      customer_id: values.clientId,
      address: values.address,
      notes: values.notes,
      requires_invoice: values.requiresInvoice,
      equipment_items: values.equipmentItems,
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
}
