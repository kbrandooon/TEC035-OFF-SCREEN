import { useQuery } from '@tanstack/react-query'
import {
  getEquipmentStats,
  type EquipmentTypeStat,
} from '../api/get-equipment-stats'

/**
 * Fetches per-type equipment availability for today.
 *
 * Uses TanStack Query for automatic refetching:
 * - Re-fetches when the browser tab regains focus (catches post-reservation updates).
 * - Caches for 30 seconds so rapid dashboard navigations don't hammer the DB.
 *
 * @returns Live today-availability stats grouped by equipment type.
 */
export function useEquipmentStats() {
  const {
    data: stats = [],
    isLoading,
    error,
    refetch,
  } = useQuery<EquipmentTypeStat[]>({
    queryKey: ['equipment-stats-today'],
    queryFn: getEquipmentStats,
    staleTime: 0, // Always refetch on mount (catches dashboard re-visits after edits)
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 60_000,
  })

  return {
    stats,
    isLoading,
    error: error
      ? error instanceof Error
        ? error.message
        : 'Error al cargar estadísticas.'
      : null,
    refetch,
  }
}
