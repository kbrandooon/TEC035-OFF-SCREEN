import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

/**
 * Formats a database timestamp into a human-readable string, 
 * treating it ALWAYS as local time to avoid the -6h UTC offset shift.
 * 
 * @param isoString - The string from Supabase (e.g. 2026-05-01T00:00:00+00)
 * @param formatStr - The date-fns format string.
 */
export function formatLocalDate(isoString: string | null | undefined, formatStr: string = 'dd MMM, hh:mm a') {
  if (!isoString) return '---'
  try {
    // We only remove the timezone offset at the END of the string (Z, +HH:mm, or -HH:mm)
    // This preserves the hyphens in the date part (YYYY-MM-DD).
    const localIso = isoString.replace(/Z|[+-]\d{2}(:\d{2})?$/, '')
    const date = parseISO(localIso)
    return format(date, formatStr, { locale: es })
  } catch (_e) {
    return 'Fecha inválida'
  }
}

/**
 * Ensures a date + time string combination is correctly formatted for Supabase.
 */
export function toDatabaseTimestamp(date: string, time: string) {
  const normalizedTime = time.length === 5 ? `${time}:00` : time
  return `${date}T${normalizedTime}`
}
