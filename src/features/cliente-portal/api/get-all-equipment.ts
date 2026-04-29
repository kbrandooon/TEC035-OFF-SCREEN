import { supabase } from '@/supabase/client'
import type { MarketplaceEquipment } from '../types'

/**
 * Fetches all equipment across every tenant for the public marketplace.
 *
 * Uses the `get_marketplace_equipment` SECURITY DEFINER RPC to bypass
 * per-tenant RLS — all authenticated clients may browse the full catalog.
 *
 * @returns Array of equipment enriched with tenant name.
 */
export async function getAllEquipment(): Promise<MarketplaceEquipment[]> {
  const { data, error } = await supabase.rpc('get_marketplace_equipment')

  if (error) throw error

  return (data ?? []).map(
    (row: {
      id: string
      name: string
      type: string
      description: string | null
      daily_rate: number
      status: string
      image_url: string | null
      tenant_id: string
      tenant_name: string
    }) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      description: row.description,
      daily_rate: row.daily_rate,
      status: row.status as MarketplaceEquipment['status'],
      image_url: row.image_url,
      tenant_id: row.tenant_id,
      tenant_name: row.tenant_name,
    })
  )
}
