/**
 * TanStack Router / browsers may pass repeated `?phone=` as an array, or odd
 * types from raw search. Normalizes to a single trimmed string or undefined.
 */
export function coerceSearchPhoneToString(value: unknown): string | undefined {
  if (value == null) return undefined

  let raw: string
  if (Array.isArray(value)) {
    const first = value[0]
    if (first == null) return undefined
    raw = typeof first === 'string' ? first : String(first)
  } else if (typeof value === 'string') {
    raw = value
  } else if (typeof value === 'number' || typeof value === 'boolean') {
    raw = String(value)
  } else {
    return undefined
  }

  const t = raw.trim()
  if (!t) return undefined
  return t.length > 48 ? t.slice(0, 48) : t
}
