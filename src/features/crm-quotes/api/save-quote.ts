import { supabase } from '@/supabase/client'
import type { Quote } from '../types/quote.types'

/**
 * Persists a draft quote and its items to the database.
 * Uses a two-step process: inserts the header first, then the line items.
 */
export async function saveQuote(quote: Partial<Quote>) {
  if (!quote.items || quote.items.length === 0) {
    throw new Error('La cotización debe tener al menos un artículo.')
  }

  // 1. Insert Quote Header
  const { data: quoteData, error: quoteError } = await supabase
    .from('quotes')
    .insert({
      tenant_id: quote.tenantId,
      lead_id: quote.leadId || null,
      client_id: quote.clientId || null,
      client_name: quote.clientName,
      status: quote.status || 'draft',
      currency: quote.currency || 'MXN',
      subtotal: quote.subtotal,
      tax_total: quote.taxTotal,
      discount_total: quote.discountTotal || 0,
      total_amount: quote.totalAmount,
      notes: quote.notes,
    })
    .select('id')
    .single()

  if (quoteError) throw quoteError

  // 2. Insert Quote Items
  const itemsToInsert = quote.items.map(item => ({
    quote_id: quoteData.id,
    equipment_id: item.equipmentId,
    name: item.name,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    discount: item.discount || 0,
    tax_rate: item.taxRate || 0.16,
    total: item.total
  }))

  const { error: itemsError } = await supabase
    .from('quote_items')
    .insert(itemsToInsert)

  if (itemsError) {
    // Note: In a production app, we might want to delete the header if items fail
    // for atomicity, but Supabase doesn't support multi-table transactions via simple API.
    throw itemsError
  }

  return quoteData.id
}
