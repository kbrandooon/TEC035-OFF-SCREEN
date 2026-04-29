import { useEffect, useState } from 'react'
import { checkEquipmentAvailability } from '../api/check-equipment-availability'
import { getEquipmentById } from '../api/get-equipment-by-id'
import { getEquipmentImageUrl } from '../api/get-equipment-image-url'
import type { MarketplaceEquipment } from '../types'

/**
 * Loads a single equipment item, its image, and optionally checks
 * availability for a given date range.
 *
 * @param id - Equipment UUID from the route param.
 * @returns Equipment data, image URL, availability, and date state.
 */
export function useEquipmentDetail(id: string) {
  const [equipment, setEquipment] = useState<MarketplaceEquipment | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Date range — computed once via lazy initializer to avoid impure Date calls during render
  const [startDate, setStartDate] = useState(
    () => new Date().toISOString().split('T')[0]
  )
  const [endDate, setEndDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  })

  // Availability state
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false)

  useEffect(() => {
    let cancelled = false
    Promise.resolve().then(() => {
      if (!cancelled) setIsLoading(true)
    })
    Promise.all([getEquipmentById(id), getEquipmentImageUrl(id)])
      .then(([item, url]) => {
        if (!cancelled) {
          setEquipment(item)
          setImageUrl(url)
        }
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : 'Error al cargar equipo')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  // Re-check availability whenever dates change; setState only called in async callbacks
  useEffect(() => {
    if (!id || !startDate || !endDate || startDate >= endDate) return
    let cancelled = false
    // Delay the loading flag to the microtask queue — avoids synchronous setState in effect
    Promise.resolve().then(() => {
      if (!cancelled) setIsCheckingAvailability(true)
    })
    checkEquipmentAvailability(id, startDate, endDate)
      .then((result) => {
        if (!cancelled) setIsAvailable(result)
      })
      .catch(() => {
        if (!cancelled) setIsAvailable(null)
      })
      .finally(() => {
        if (!cancelled) setIsCheckingAvailability(false)
      })
    return () => {
      cancelled = true
    }
  }, [id, startDate, endDate])

  /** Number of rental days from the selected range. */
  const days = Math.max(
    1,
    Math.ceil(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86_400_000
    )
  )

  const total = equipment ? equipment.daily_rate * days : 0

  return {
    equipment,
    imageUrl,
    isLoading,
    error,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    days,
    total,
    isAvailable,
    isCheckingAvailability,
  }
}
