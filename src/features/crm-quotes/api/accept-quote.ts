import { supabase } from '@/supabase/client'
import type { Quote } from '../types/quote.types'

/**
 * Handles the full conversion flow: Quote -> Client -> Booking -> BookingEquipments
 */
export async function acceptQuote(quote: Quote, leadId: string) {
  // 1. Ensure we have a client_id (Create client if lead is new)
  let clientId = quote.clientId

  if (!clientId || clientId === '') {
    const { data: leadData } = await supabase
      .from('leads')
      .select('contact_name, contact_email, contact_phone, tenant_id')
      .eq('id', leadId)
      .single()

    if (leadData) {
      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert({
          tenant_id: leadData.tenant_id,
          full_name: leadData.contact_name,
          email: leadData.contact_email,
          phone: leadData.contact_phone,
        })
        .select('id')
        .single()
      
      if (clientError) throw clientError
      clientId = newClient.id
    }
  }

  if (!clientId) throw new Error('No se pudo determinar o crear el cliente para esta reserva.')

  // 2. Fetch Lead Windows for the Booking
  const { data: lead } = await supabase
    .from('leads')
    .select('window_start, window_end')
    .eq('id', leadId)
    .single()

  if (!lead) throw new Error('No se encontró el lead original.')

  // 3. Create the Booking
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      tenant_id: quote.tenantId,
      client_id: clientId,
      title: `Reserva: ${quote.clientName}`,
      start_time: lead.window_start,
      end_time: lead.window_end,
      hourly_rate: 0, // Not used as we have the final total from quote
      status: 'confirmed',
      notes: quote.notes
    })
    .select('id')
    .single()

  if (bookingError) throw bookingError

  // 4. Link Equipment (using plural 'equipments' table name as seen in schema)
  if (quote.items && quote.items.length > 0) {
    const bookingItems = quote.items
      .filter(item => item.equipmentId) // Only items that are actual equipment
      .map(item => ({
        booking_id: booking.id,
        equipment_id: item.equipmentId
      }))

    if (bookingItems.length > 0) {
      const { error: equipError } = await supabase
        .from('booking_equipments')
        .insert(bookingItems)
      
      if (equipError) throw equipError
    }
  }

  // 5. Update Quote Status
  const { error: quoteUpdateError } = await supabase
    .from('quotes')
    .update({ status: 'accepted' })
    .eq('id', quote.id)

  if (quoteUpdateError) throw quoteUpdateError

  return booking.id
}
