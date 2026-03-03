import { supabase } from '@/supabase/client'

/**
 * Permanently deletes a reservation record by ID.
 * @param id - UUID of the reservation to delete.
 */
export async function deleteReservation(id: string): Promise<void> {
  const { error } = await supabase.from('reservations').delete().eq('id', id)

  if (error) throw new Error(error.message)
}
