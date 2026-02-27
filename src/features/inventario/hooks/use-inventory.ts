import { useCallback, useEffect, useState } from 'react'
import { createInventoryMovement } from '../api/create-inventory'
import { getInventory } from '../api/get-inventory'
import type { InventoryFormValues, InventoryMovement } from '../types'

/**
 * Manages the inventory movements list with CRUD operations and loading state.
 */
export function useInventory() {
  const [inventory, setInventory] = useState<InventoryMovement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchInventory = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getInventory()
      setInventory(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el inventario.')
    } finally {
      setIsLoading(false)
    }
  }, [])

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

  return { inventory, isLoading, error, refetch: fetchInventory, onCreate: handleCreate }
}
