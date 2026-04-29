import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getEquipmentAvailability } from '../api/get-equipment-availability'
import type {
  EquipmentAvailabilityFilters,
  EquipmentAvailabilityResult,
} from '../types'

/**
 * Manages filter state and data-fetching for equipment availability.
 *
 * The RPC fires once per date window. All other filters (multi-select names,
 * multi-select categories) are applied client-side on the raw results.
 */
export function useEquipmentAvailability() {
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  /** Multi-select category filter — empty = all. */
  const [types, setTypes] = useState<string[]>([])
  /** Multi-select name filter — empty = all. */
  const [selectedNames, setSelectedNames] = useState<string[]>([])

  const canQuery = Boolean(start && end)

  const {
    data: rawResults = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery<EquipmentAvailabilityResult[]>({
    queryKey: ['equipment-availability', start, end],
    queryFn: () => getEquipmentAvailability(start, end),
    enabled: canQuery,
    staleTime: 30_000,
  })

  /** Client-side filter: categories AND selected names (both optional). */
  const results = useMemo<EquipmentAvailabilityResult[]>(() => {
    if (!rawResults.length) return []
    let filtered = rawResults

    if (types.length > 0) {
      filtered = filtered.filter((r) => types.includes(r.type))
    }
    if (selectedNames.length > 0) {
      filtered = filtered.filter((r) => selectedNames.includes(r.name))
    }
    return filtered
  }, [rawResults, types, selectedNames])

  /** All unique types from the raw results. */
  const availableTypes = useMemo<string[]>(
    () => [...new Set(rawResults.map((r) => r.type))].sort(),
    [rawResults]
  )

  /**
   * Names available for the name combobox.
   * When categories are selected, only shows names from those categories.
   * This ensures the name picker is always consistent with the category filter.
   */
  const availableNames = useMemo<string[]>(() => {
    const source =
      types.length > 0
        ? rawResults.filter((r) => types.includes(r.type))
        : rawResults
    return [...new Set(source.map((r) => r.name))].sort()
  }, [rawResults, types])

  const clearTypes = () => {
    setTypes([])
    // When categories are cleared, reset name selection too (they may no longer be valid)
    setSelectedNames([])
  }
  const clearNames = () => setSelectedNames([])

  const toggleName = (n: string) =>
    setSelectedNames((prev) =>
      prev.includes(n) ? prev.filter((v) => v !== n) : [...prev, n]
    )

  const toggleType = (t: string) => {
    setTypes((prev) => {
      const next = prev.includes(t) ? prev.filter((v) => v !== t) : [...prev, t]
      // Remove selected names that are no longer in any selected category
      if (next.length > 0) {
        const validNames = new Set(
          rawResults.filter((r) => next.includes(r.type)).map((r) => r.name)
        )
        setSelectedNames((prev) => prev.filter((n) => validNames.has(n)))
      } else {
        setSelectedNames([])
      }
      return next
    })
  }

  const filters: EquipmentAvailabilityFilters = {
    start,
    end,
    type: types.join(','),
  }

  return {
    filters,
    start,
    setStart,
    end,
    setEnd,
    types,
    toggleType,
    clearTypes,
    selectedNames,
    toggleName,
    clearNames,
    canQuery,
    results,
    availableTypes,
    availableNames,
    isLoading: isLoading || isFetching,
    error,
    refetch,
  }
}
