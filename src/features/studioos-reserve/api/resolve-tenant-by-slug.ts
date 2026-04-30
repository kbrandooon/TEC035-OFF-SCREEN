import { supabase } from '@/supabase/client'

export interface TenantBySlugRow {
  id: string
  name: string
  slug: string
}

/**
 * Loads a single tenant row by public slug (for `/reserve/:tenantSlug`).
 * Uses `get_tenant_by_slug_public` so any **authenticated** user can resolve
 * the studio from the link (Google does not imply membership in the tenant).
 */
export async function resolveTenantBySlug(
  slug: string
): Promise<TenantBySlugRow | null> {
  const { data, error } = await supabase.rpc('get_tenant_by_slug_public', {
    p_slug: slug,
  })

  if (error) throw error

  const rows = (data ?? []) as TenantBySlugRow[]
  return rows[0] ?? null
}
