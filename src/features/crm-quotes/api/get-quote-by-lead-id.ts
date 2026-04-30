import { supabase } from '@/supabase/client'
import type { Quote, QuoteItem } from '../types/quote.types'

export interface QuoteWithContext extends Quote {
  tenantName: string
  windowStart: string
  windowEnd: string
}

export async function getQuoteByLeadId(leadId: string): Promise<QuoteWithContext | null> {
  const { data, error } = await supabase
    .from('quotes')
    .select(`
      id,
      lead_id,
      tenant_id,
      client_id,
      client_name,
      status,
      currency,
      subtotal,
      tax_total,
      discount_total,
      total_amount,
      notes,
      valid_until,
      created_at,
      tenant:tenants ( name ),
      lead:leads ( window_start, window_end ),
      quote_items (
        id,
        name,
        quantity,
        unit_price,
        discount,
        tax_rate,
        total,
        equipment_id
      )
    `)
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const items: QuoteItem[] = ((data as any).quote_items ?? []).map((item: any) => ({
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    unitPrice: item.unit_price,
    discount: item.discount ?? 0,
    taxRate: item.tax_rate ?? 0.16,
    total: item.total,
    equipmentId: item.equipment_id ?? null,
  }))

  const d = data as any
  return {
    id: d.id,
    leadId: d.lead_id,
    tenantId: d.tenant_id,
    clientId: d.client_id,
    clientName: d.client_name,
    status: d.status,
    currency: d.currency,
    subtotal: d.subtotal,
    taxTotal: d.tax_total,
    discountTotal: d.discount_total ?? 0,
    totalAmount: d.total_amount,
    notes: d.notes ?? '',
    validUntil: d.valid_until ?? undefined,
    items,
    tenantName: d.tenant?.name ?? 'StudioOS',
    windowStart: d.lead?.window_start ?? '',
    windowEnd: d.lead?.window_end ?? '',
  }
}
