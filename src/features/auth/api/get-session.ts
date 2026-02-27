import { supabase } from '@/supabase/client'
import type { Session } from '../types'

/**
 * Fetches the current session.
 */
export async function getSession(): Promise<Session | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session
}
