import { supabase } from '@/supabase/client'
import type { PublicReservationRequestPayload } from '../types'

/**
 * Persists a new lead in the public.leads table.
 * This is used by both authenticated and guest reservation flows.
 * 
 * @param payload The collected lead data from the reservation wizard.
 * @returns The created lead record or throws an error.
 */
export async function createLead(payload: PublicReservationRequestPayload) {
  const {
    tenantId,
    contactName,
    contactEmail,
    contactPhone,
    companyName,
    rentalKind,
    paxCount,
    requiresInvoice,
    budget,
    notes,
    windowStart,
    windowEnd,
    equipmentIds,
    source,
    submittedByUserId,
  } = payload

  const { data, error } = await supabase
    .from('leads')
    .insert({
      tenant_id: tenantId,
      contact_name: contactName,
      contact_email: contactEmail,
      contact_phone: contactPhone,
      company_name: companyName,
      rental_kind: rentalKind,
      pax_count: paxCount,
      requires_invoice: requiresInvoice,
      budget: budget || 0,
      notes,
      window_start: windowStart,
      window_end: windowEnd,
      equipment_ids: equipmentIds,
      source,
      submitted_by_user_id: submittedByUserId,
      status: 'nuevo',
    })
    .select('id')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}
