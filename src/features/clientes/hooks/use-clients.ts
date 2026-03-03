import { useCallback, useEffect, useState } from 'react'
import { createClient } from '../api/create-client'
import { deleteClient } from '../api/delete-client'
import { getClients } from '../api/get-clients'
import { updateClient } from '../api/update-client'
import type { Customer, CustomerFormValues } from '../types'

/**
 * Manages the full customer list with CRUD operations and loading state.
 * Fetches customers on mount and exposes imperative callbacks for mutations.
 */
export function useClients() {
  const [clients, setClients] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchClients = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getClients()
      setClients(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar clientes.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchClients()
  }, [fetchClients])

  const handleCreate = useCallback(
    async (values: CustomerFormValues) => {
      await createClient(values)
      await fetchClients()
    },
    [fetchClients]
  )

  const handleUpdate = useCallback(
    async (id: string, values: Partial<CustomerFormValues>) => {
      await updateClient(id, values)
      await fetchClients()
    },
    [fetchClients]
  )

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteClient(id)
      await fetchClients()
    },
    [fetchClients]
  )

  return {
    clients,
    isLoading,
    error,
    refetch: fetchClients,
    onCreate: handleCreate,
    onUpdate: handleUpdate,
    onDelete: handleDelete,
  }
}
