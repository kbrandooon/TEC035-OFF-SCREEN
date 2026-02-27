import { supabase } from '@/supabase/client'
import type { Session } from '../types'

/**
 * Listens for auth state changes.
 */
export function onAuthStateChange(
  callback: (event: unknown, session: Session | null) => void
) {
  return supabase.auth.onAuthStateChange(callback)
}
