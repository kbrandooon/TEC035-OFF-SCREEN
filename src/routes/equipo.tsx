import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useAuth } from '@/features/auth'
import {
  EquipmentFormModal,
  EquipmentList,
  useEquipment,
} from '@/features/equipo'
import type { Equipment, EquipmentFormValues } from '@/features/equipo'

export const Route = createFileRoute('/equipo')({
  component: EquipoPage,
})

/**
 * Equipment management page under /equipo.
 * Shows a grid of all equipment items; allows creating, editing, and deleting.
 */
function EquipoPage() {
  const navigate = useNavigate()
  const { user, isLoading: isAuthLoading } = useAuth()
  const { equipment, isLoading, error, onCreate, onUpdate, onDelete } =
    useEquipment()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Equipment | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  if (!isAuthLoading && !user) {
    void navigate({ to: '/' })
    return null
  }

  const openCreateModal = () => {
    setEditingItem(null)
    setSaveError(null)
    setIsModalOpen(true)
  }

  const openEditModal = (item: Equipment) => {
    setEditingItem(item)
    setSaveError(null)
    setIsModalOpen(true)
  }

  const handleSave = async (values: EquipmentFormValues) => {
    setIsSaving(true)
    setSaveError(null)
    try {
      if (editingItem) {
        await onUpdate(editingItem.id, values)
      } else {
        await onCreate(values)
      }
      setIsModalOpen(false)
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : 'Error al guardar el equipo.'
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (item: Equipment) => {
    try {
      await onDelete(item.id)
    } catch {
      // Errors swallowed at this layer; a toast system would surface them in production
    }
  }

  return (
    <DashboardLayout>
      {/* Page header */}
      <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
        <div>
          <h3 className='text-2xl font-bold tracking-tight text-slate-800 dark:text-white'>
            Equipo
          </h3>
          <p className='mt-1 text-sm text-slate-500 dark:text-slate-400'>
            Gestiona el inventario de equipo de tu estudio.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className='bg-primary hover:bg-primary-hover flex items-center gap-2 rounded-lg border border-transparent px-5 py-2.5 font-medium text-white shadow transition-all hover:shadow-md active:scale-[0.98]'
        >
          <span className='material-symbols-outlined text-[20px] font-normal'>
            add
          </span>
          Nuevo Equipo
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className='flex h-64 items-center justify-center'>
          <span className='material-symbols-outlined animate-spin text-[36px] font-normal text-slate-400'>
            progress_activity
          </span>
        </div>
      ) : error ? (
        <div className='rounded-lg border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-600 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400'>
          {error}
        </div>
      ) : (
        <EquipmentList
          equipment={equipment}
          onEdit={openEditModal}
          onDelete={(item) => void handleDelete(item)}
        />
      )}

      {/* Modal */}
      <EquipmentFormModal
        equipment={editingItem}
        isOpen={isModalOpen}
        isSaving={isSaving}
        error={saveError}
        onClose={() => setIsModalOpen(false)}
        onSave={async (values) => { await handleSave(values) }}
      />
    </DashboardLayout>
  )
}
