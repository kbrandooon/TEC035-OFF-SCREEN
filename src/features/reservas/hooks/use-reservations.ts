import { useCallback, useEffect, useState } from 'react'
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
 */
export function useReservations() {
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

  const handleCreate = useCallback(
    async (values: ReservationFormValues) => {
      await createReservation(values)
      await fetchReservations()
    },
    [fetchReservations]
  )

  const handleUpdate = useCallback(
    async (id: string, values: ReservationFormValues) => {
      await updateReservation(id, values)
      await fetchReservations()
    },
    [fetchReservations]
  )

  const handleUpdateStatus = useCallback(
    async (id: string, status: ReservationStatus) => {
      await updateReservationStatus(id, status)
      await fetchReservations()
    },
    [fetchReservations]
  )

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteReservation(id)
      await fetchReservations()
    },
    [fetchReservations]
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
