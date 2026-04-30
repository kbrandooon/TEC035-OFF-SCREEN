import { z } from 'zod'

export const quoteItemSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'El nombre del artículo es obligatorio'),
  quantity: z.number().min(1),
  unitPrice: z.number().min(0),
  discount: z.number().min(0).default(0),
  taxRate: z.number().default(0.16),
  total: z.number(),
  equipmentId: z.string().uuid().optional().or(z.null()),
})

export const quoteSchema = z.object({
  id: z.string().uuid().optional(),
  leadId: z.string().uuid().optional().or(z.null()),
  tenantId: z.string().uuid(),
  clientId: z.string().uuid(),
  clientName: z.string(),
  status: z.enum(['draft', 'sent', 'accepted', 'rejected', 'expired']).default('draft'),
  currency: z.string().default('MXN'),
  subtotal: z.number(),
  taxTotal: z.number(),
  discountTotal: z.number(),
  totalAmount: z.number(),
  validUntil: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(quoteItemSchema),
})

export type QuoteItem = z.infer<typeof quoteItemSchema>
export type Quote = z.infer<typeof quoteSchema>
