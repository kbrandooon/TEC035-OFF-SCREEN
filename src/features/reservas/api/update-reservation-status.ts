import { supabase } from '@/supabase/client'
import type { ReservationStatus } from '../types'

/**
 * Updates the status of a single reservation.
 *
 * @param id     - UUID of the reservation to update.
 * @param status - New status value.
 */
export async function updateReservationStatus(
  id: string,
  status: ReservationStatus
): Promise<void> {
  const { error } = await supabase
    .from('reservations')
    .update({ status })
    .eq('id', id)

  if (error) throw new Error(error.message)
}
