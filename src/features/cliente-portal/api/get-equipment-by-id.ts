import { supabase } from '@/supabase/client'
import type { MarketplaceEquipment } from '../types'

/**
 * Fetches a single equipment item by ID, enriched with its tenant name.
 *
 * @param id - UUID of the equipment row.
 * @returns The equipment record or `null` if not found.
 */
export async function getEquipmentById(
  id: string
): Promise<MarketplaceEquipment | null> {
  const { data, error } = await supabase
    .from('equipment')
    .select(
      `id, name, type, description, daily_rate, status, image_url, tenant_id,
       tenants ( name )`
    )
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const rawTenants = data.tenants as
    | { name: string }
    | { name: string }[]
    | null
    | undefined
  let tenantName = 'Estudio desconocido'
  if (rawTenants && !Array.isArray(rawTenants) && rawTenants.name) {
    tenantName = rawTenants.name
  } else if (Array.isArray(rawTenants) && rawTenants[0]?.name) {
    tenantName = rawTenants[0].name
  }

  return {
    id: data.id,
    name: data.name,
    type: data.type,
    description: data.description,
    daily_rate: data.daily_rate,
    status: data.status as MarketplaceEquipment['status'],
    image_url: data.image_url,
    tenant_id: data.tenant_id,
    tenant_name: tenantName,
  }
}
