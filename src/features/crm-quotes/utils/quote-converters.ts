import type { Lead } from '@/features/crm-leads/types'
import type { Quote, QuoteItem } from '../types/quote.types'

/**
 * Calculates hours between two ISO dates.
 */
function calculateDurationHours(start: string, end: string): number {
  if (!start || !end) return 0
  const diff = new Date(end).getTime() - new Date(start).getTime()
  const hours = diff / (1000 * 60 * 60)
  return Math.max(Math.ceil(hours), 0)
}

/**
 * Transforms a Lead and its associated equipment into a Draft Quote.
 * Now factors in total hours for the final calculation.
 */
export function createQuoteFromLead(lead: Lead, equipment: any[] = []): Partial<Quote> {
  const hours = calculateDurationHours(lead.window_start, lead.window_end) || 1
  
  const items: QuoteItem[] = equipment.map(item => {
    const unitPrice = item.daily_rate || 0
    const quantity = 1
    const discount = 0
    const lineTotal = (quantity * unitPrice * hours) - discount

    return {
      equipmentId: item.id,
      name: item.name,
      quantity,
      unitPrice,
      discount,
      taxRate: 0.16,
      total: lineTotal
    }
  })

  const totalAmount = items.reduce((acc, item) => acc + item.total, 0)
  const subtotal = totalAmount / 1.16
  const taxTotal = totalAmount - subtotal
  
  return {
    leadId: lead.id,
    tenantId: lead.tenant_id,
    clientId: (lead as any).client_id || '',
    clientName: lead.contact_name || 'Prospecto sin nombre',
    status: 'draft',
    currency: 'MXN',
    subtotal,
    taxTotal,
    discountTotal: 0,
    totalAmount,
    notes: lead.notes || '',
    items,
  }
}
