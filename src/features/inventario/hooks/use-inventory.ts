import { useCallback, useEffect, useRef, useState } from 'react'
import { createInventoryMovement } from '../api/create-inventory'
import { getInventory, PAGE_SIZE } from '../api/get-inventory'
import type {
  InventoryFormValues,
  InventoryMovement,
  MovementType,
} from '../types'

export interface UseInventoryParams {
  page: number
  dateFrom?: string
  dateTo?: string
  movementType?: MovementType
  clasification?: string
}

/**
 * Manages a paginated, filtered inventory movements list.
 * Re-fetches when any param changes. Stale-request guard via fetchId ref.
 */
export function useInventory(
  {
    page,
    dateFrom,
    dateTo,
    movementType,
    clasification,
  }: UseInventoryParams = { page: 1 }
) {
  const [inventory, setInventory] = useState<InventoryMovement[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchId = useRef(0)

  const fetchInventory = useCallback(async () => {
    const id = ++fetchId.current
    setIsLoading(true)
    setError(null)
    try {
      const result = await getInventory({
        page,
        dateFrom,
        dateTo,
        movementType,
        clasification,
      })
      if (id !== fetchId.current) return
      setInventory(result.data)
      setTotal(result.total)
    } catch (err) {
      if (id !== fetchId.current) return
      setError(
        err instanceof Error ? err.message : 'Error al cargar el inventario.'
      )
    } finally {
      if (id === fetchId.current) setIsLoading(false)
    }
  }, [page, dateFrom, dateTo, movementType, clasification])

  useEffect(() => {
    void fetchInventory()
  }, [fetchInventory])

  const handleCreate = useCallback(
    async (values: InventoryFormValues) => {
      await createInventoryMovement(values)
      await fetchInventory()
    },
    [fetchInventory]
  )

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return {
    inventory,
    total,
    pageSize: PAGE_SIZE,
    totalPages,
    isLoading,
    error,
    refetch: fetchInventory,
    onCreate: handleCreate,
  }
}
