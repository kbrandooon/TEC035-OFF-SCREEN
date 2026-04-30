import { supabase } from '@/supabase/client'

/**
 * Display name for the reserve gate (works for `anon`: no Google session yet).
 * Requires RPC `get_tenant_display_by_slug_public` on Supabase.
 */
export async function getTenantDisplayNameBySlug(
  slug: string
): Promise<string | null> {
  const { data, error } = await supabase.rpc(
    'get_tenant_display_by_slug_public',
    { p_slug: slug }
  )

  if (error) throw error

  const rows = (data ?? []) as { name: string }[]
  return rows[0]?.name ?? null
}
