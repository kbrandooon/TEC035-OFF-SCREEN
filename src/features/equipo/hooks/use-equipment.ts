import { useCallback, useEffect, useState } from 'react'
import { createEquipment } from '../api/create-equipment'
import { deleteEquipment } from '../api/delete-equipment'
import { getEquipment } from '../api/get-equipment'
import { updateEquipment } from '../api/update-equipment'
import type { Equipment, EquipmentFormValues } from '../types'

/**
 * Manages the full equipment list with CRUD operations and loading state.
 */
export function useEquipment() {
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEquipment = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getEquipment()
      setEquipment(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar equipo.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchEquipment()
  }, [fetchEquipment])

  const handleCreate = useCallback(
    async (values: EquipmentFormValues) => {
      await createEquipment(values)
      await fetchEquipment()
    },
    [fetchEquipment]
  )

  const handleUpdate = useCallback(
    async (id: string, values: Partial<EquipmentFormValues>) => {
      await updateEquipment(id, values)
      await fetchEquipment()
    },
    [fetchEquipment]
  )

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteEquipment(id)
      await fetchEquipment()
    },
    [fetchEquipment]
  )

  return {
    equipment,
    isLoading,
    error,
    refetch: fetchEquipment,
    onCreate: handleCreate,
    onUpdate: handleUpdate,
    onDelete: handleDelete,
  }
}
