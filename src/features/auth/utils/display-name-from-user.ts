import type { User } from '@supabase/supabase-js'

/**
 * Best-effort display name for OAuth (Google) and other providers.
 * Supabase usually mirrors Google fields into `user_metadata` and/or
 * `identities[].identity_data`.
 */
export function displayNameFromOAuthUser(
  user: User | null | undefined
): string {
  if (!user) return ''

  const meta = user.user_metadata as Record<string, unknown> | undefined
  if (meta) {
    const fromMeta = [
      meta.full_name,
      meta.name,
      meta.display_name,
      [meta.given_name, meta.family_name].filter(Boolean).join(' '),
    ]
    for (const c of fromMeta) {
      if (typeof c === 'string' && c.trim()) return c.trim()
    }
  }

  const raw = user.identities?.[0]?.identity_data
  if (raw && typeof raw === 'object') {
    const d = raw as Record<string, unknown>
    const full = d.full_name ?? d.name
    if (typeof full === 'string' && full.trim()) return full.trim()
    const combined = [d.given_name, d.family_name]
      .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
      .join(' ')
      .trim()
    if (combined) return combined
  }

  return ''
}
