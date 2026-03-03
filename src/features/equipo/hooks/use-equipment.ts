import { useCallback, useEffect, useRef, useState } from 'react'
import { createEquipment } from '../api/create-equipment'
import { deleteEquipment } from '../api/delete-equipment'
import { getEquipment, PAGE_SIZE } from '../api/get-equipment'
import { updateEquipment } from '../api/update-equipment'
import type {
  Equipment,
  EquipmentFormValues,
  EquipmentStatus,
  EquipmentType,
} from '../types'

interface UseEquipmentParams {
  page: number
  search?: string
  status?: EquipmentStatus | null
  type?: EquipmentType | null
}

/**
 * Fetches a paginated, filtered page of equipment.
 * Re-fetches automatically when page / search / status / type change.
 */
export function useEquipment(params: UseEquipmentParams) {
  const { page, search = '', status, type } = params

  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Track latest fetch to discard stale responses
  const fetchId = useRef(0)

  const fetchEquipment = useCallback(async () => {
    const id = ++fetchId.current
    setIsLoading(true)
    setError(null)
    try {
      const result = await getEquipment({
        page,
        search,
        status: status ?? null,
        type: type ?? null,
      })
      if (id !== fetchId.current) return // stale, discard
      setEquipment(result.data)
      setTotal(result.total)
    } catch (err) {
      if (id !== fetchId.current) return
      setError(err instanceof Error ? err.message : 'Error al cargar equipo.')
    } finally {
      if (id === fetchId.current) setIsLoading(false)
    }
  }, [page, search, status, type])

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
    total,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil(total / PAGE_SIZE),
    isLoading,
    error,
    refetch: fetchEquipment,
    onCreate: handleCreate,
    onUpdate: handleUpdate,
    onDelete: handleDelete,
  }
}
