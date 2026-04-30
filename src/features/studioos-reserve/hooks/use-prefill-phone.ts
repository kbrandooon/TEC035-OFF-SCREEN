import { RESERVE_PREFILL_PHONE_KEY } from '../constants'
import { coerceSearchPhoneToString } from '../utils/coerce-search-phone'

/**
 * Normalizes the raw `?phone=` search param, persists it to sessionStorage
 * (so it survives the Google OAuth redirect), and returns the decoded string.
 */
export function usePrefillPhone(rawPhone: unknown): string {
  const normalized = coerceSearchPhoneToString(rawPhone)
  
  let decoded = ''
  if (normalized) {
    try {
      decoded = decodeURIComponent(normalized)
    } catch {
      decoded = normalized
    }
    
    // Persist to session storage so it survives OAuth flow
    try {
      sessionStorage.setItem(RESERVE_PREFILL_PHONE_KEY, decoded)
    } catch {
      // Ignored
    }
  } else {
    // If no param, try to recover from session storage
    try {
      decoded = sessionStorage.getItem(RESERVE_PREFILL_PHONE_KEY) ?? ''
    } catch {
      decoded = ''
    }
  }

  return decoded
}
