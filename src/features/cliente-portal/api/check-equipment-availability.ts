import { supabase } from '@/supabase/client'

/**
 * Checks whether an equipment item has any confirmed or pending reservation
 * that overlaps with the requested date range.
 *
 * @param equipmentId - UUID of the equipment to check.
 * @param startDate   - Rental start date (YYYY-MM-DD).
 * @param endDate     - Rental end date (YYYY-MM-DD).
 * @returns `true` if the item is available for the full requested period.
 */
export async function checkEquipmentAvailability(
  equipmentId: string,
  startDate: string,
  endDate: string
): Promise<boolean> {
  const { count, error } = await supabase
    .from('reservations')
    .select('id', { count: 'exact', head: true })
    .eq('equipment_id', equipmentId)
    .in('status', ['pending', 'confirmed'])
    // Overlap: existing.start < requested.end AND existing.end > requested.start
    .lt('date', endDate)
    .gt('end_date', startDate)

  if (error) throw error
  return (count ?? 0) === 0
}
