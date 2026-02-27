import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useAuth } from '@/features/auth'
import {
  ClientFormModal,
  ClientList,
  useClients,
} from '@/features/clientes'
import type { Customer, CustomerFormValues } from '@/features/clientes'

export const Route = createFileRoute('/clientes')({
  component: ClientesPage,
})

/**
 * Clientes management page under /clientes.
 * Lists all tenant customers; allows creating, editing, and deleting records.
 */
function ClientesPage() {
  const navigate = useNavigate()
  const { user, isLoading: isAuthLoading } = useAuth()
  const { clients, isLoading, error, onCreate, onUpdate, onDelete } =
    useClients()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Customer | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  if (!isAuthLoading && !user) {
    void navigate({ to: '/' })
    return null
  }

  const openCreateModal = () => {
    setEditingClient(null)
    setSaveError(null)
    setIsModalOpen(true)
  }

  const openEditModal = (client: Customer) => {
    setEditingClient(client)
    setSaveError(null)
    setIsModalOpen(true)
  }

  const handleSave = async (values: CustomerFormValues) => {
    setIsSaving(true)
    setSaveError(null)
    try {
      if (editingClient) {
        await onUpdate(editingClient.id, values)
      } else {
        await onCreate(values)
      }
      setIsModalOpen(false)
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : 'Error al guardar el cliente.'
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (client: Customer) => {
    try {
      await onDelete(client.id)
    } catch {
      // Errors swallowed here; a toast system would surface them in production
    }
  }

  return (
    <DashboardLayout>
      {/* Page header */}
      <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
        <div>
          <h3 className='text-2xl font-bold tracking-tight text-slate-800 dark:text-white'>
            Clientes
          </h3>
          <p className='mt-1 text-sm text-slate-500 dark:text-slate-400'>
            Gestiona el directorio de clientes de tu estudio.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className='bg-primary hover:bg-primary-hover flex items-center gap-2 rounded-lg border border-transparent px-5 py-2.5 font-medium text-white shadow transition-all hover:shadow-md active:scale-[0.98]'
        >
          <span className='material-symbols-outlined text-[20px] font-normal'>person_add</span>
          Nuevo Cliente
        </button>
      </div>

      {isLoading ? (
        <div className='flex h-64 items-center justify-center'>
          <span className='material-symbols-outlined animate-spin text-[36px] font-normal text-slate-400'>progress_activity</span>
        </div>
      ) : error ? (
        <div className='rounded-lg border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-600 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400'>{error}</div>
      ) : (
        <ClientList
          clients={clients}
          onEdit={openEditModal}
          onDelete={(client) => void handleDelete(client)}
        />
      )}

      <ClientFormModal
        client={editingClient}
        isOpen={isModalOpen}
        isSaving={isSaving}
        error={saveError}
        onClose={() => setIsModalOpen(false)}
        onSave={async (values) => { await handleSave(values) }}
      />
    </DashboardLayout>
  )
}
