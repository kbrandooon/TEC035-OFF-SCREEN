import { useCallback, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createReservation } from '../api/create-reservation'
import { deleteReservation } from '../api/delete-reservation'
import { getReservations } from '../api/get-reservations'
import { updateReservation } from '../api/update-reservation'
import { updateReservationStatus } from '../api/update-reservation-status'
import type {
  Reservation,
  ReservationFormValues,
  ReservationStatus,
} from '../types'

/**
 * Manages the reservation list with full CRUD + status operations.
 *
 * After every successful mutation the `equipment-stats-today` TanStack Query
 * cache is invalidated so the inventory status widget on the Dashboard
 * reflects changes immediately—even without navigating back to that route.
 */
export function useReservations() {
  const queryClient = useQueryClient()

  const [reservations, setReservations] = useState<Reservation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReservations = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getReservations()
      setReservations(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar reservas.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchReservations()
  }, [fetchReservations])

  /** Invalidates the equipment availability cache after any reservation change. */
  const invalidateEquipmentStats = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['equipment-stats-today'] })
  }, [queryClient])

  const handleCreate = useCallback(
    async (values: ReservationFormValues) => {
      await createReservation(values)
      await fetchReservations()
      invalidateEquipmentStats()
    },
    [fetchReservations, invalidateEquipmentStats]
  )

  const handleUpdate = useCallback(
    async (id: string, values: ReservationFormValues) => {
      await updateReservation(id, values)
      await fetchReservations()
      invalidateEquipmentStats()
    },
    [fetchReservations, invalidateEquipmentStats]
  )

  const handleUpdateStatus = useCallback(
    async (id: string, status: ReservationStatus) => {
      await updateReservationStatus(id, status)
      await fetchReservations()
      invalidateEquipmentStats()
    },
    [fetchReservations, invalidateEquipmentStats]
  )

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteReservation(id)
      await fetchReservations()
      invalidateEquipmentStats()
    },
    [fetchReservations, invalidateEquipmentStats]
  )

  return {
    reservations,
    isLoading,
    error,
    refetch: fetchReservations,
    onCreate: handleCreate,
    onUpdate: handleUpdate,
    onUpdateStatus: handleUpdateStatus,
    onDelete: handleDelete,
  }
}
