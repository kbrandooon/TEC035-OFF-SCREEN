import { supabase } from '@/supabase/client'

interface EquipmentItemPayload {
  name: string
  quantity: number
  image_url: string
  daily_rate: number
  equipmentId: string
}

interface CreateClientReservationParams {
  clientProfileId: string
  equipmentId: string
  tenantId: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  equipmentItem: EquipmentItemPayload
}

/**
 * Creates a reservation on behalf of a client user.
 *
 * Uses `create_client_reservation` SECURITY DEFINER RPC to bypass the
 * `set_tenant_id_from_jwt` trigger. Also stores the equipment detail in
 * `equipment_items` as a JSONB array entry.
 *
 * @param data - Reservation payload including time and equipment item detail.
 */
export async function createClientReservation(
  data: CreateClientReservationParams
): Promise<void> {
  const { error } = await supabase.rpc('create_client_reservation', {
    p_client_profile_id: data.clientProfileId,
    p_equipment_id: data.equipmentId,
    p_tenant_id: data.tenantId,
    p_start_date: data.startDate,
    p_end_date: data.endDate,
    p_start_time: data.startTime,
    p_end_time: data.endTime,
    p_equipment_items: JSON.stringify([data.equipmentItem]),
  })

  if (error) throw error
}
