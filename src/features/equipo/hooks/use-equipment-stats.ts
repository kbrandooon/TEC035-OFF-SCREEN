import { useCallback, useEffect, useState } from 'react'
import {
  getEquipmentStats,
  type EquipmentTypeStat,
} from '../api/get-equipment-stats'

/**
 * Fetches and caches per-type equipment stock summaries.
 * Re-fetches automatically on mount; exposes a manual `refetch` callback.
 *
 * @returns Live inventory stats grouped by equipment type.
 */
export function useEquipmentStats() {
  const [stats, setStats] = useState<EquipmentTypeStat[]>([])
  const [isLoading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getEquipmentStats()
      setStats(data)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error al cargar estadísticas.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetch()
  }, [fetch])

  return { stats, isLoading, error, refetch: fetch }
}
