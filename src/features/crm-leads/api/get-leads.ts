import { supabase } from '@/supabase/client'
import type { Lead, LeadsFilter } from '../types'

/**
 * Fetches leads for a specific tenant with optional filtering.
 * 
 * @param tenantId The current tenant context.
 * @param filters Optional status, source, or search filters.
 * @returns A list of leads ordered by most recent.
 */
export async function getLeads(tenantId: string, filters?: LeadsFilter) {
  let query = supabase
    .from('leads')
    .select('id, contact_name, contact_email, contact_phone, company_name, rental_kind, pax_count, requires_invoice, budget, notes, window_start, window_end, source, status, equipment_ids, created_at')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.source) {
    query = query.eq('source', filters.source)
  }

  if (filters?.search) {
    query = query.or(`contact_name.ilike.%${filters.search}%,company_name.ilike.%${filters.search}%,contact_phone.ilike.%${filters.search}%`)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  return (data as unknown as Lead[]) || []
}
