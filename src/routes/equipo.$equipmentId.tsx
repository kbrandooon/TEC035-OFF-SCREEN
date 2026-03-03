import { useEffect, useState } from 'react'
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useAuth } from '@/features/auth'
import {
  EquipmentDetailView,
  EquipmentFormModal,
  useEquipment,
  type Equipment,
  type EquipmentFormValues,
} from '@/features/equipo'
import { getEquipmentById } from '@/features/equipo/api/get-equipment-by-id'

export const Route = createFileRoute('/equipo/$equipmentId')({
  component: EquipmentDetailPage,
})

/**
 * Equipment detail page under /equipo/:equipmentId.
 * Shows all fields for a single item; hosts Edit (modal) and Delete actions.
 */
function EquipmentDetailPage() {
  const { equipmentId } = Route.useParams()
  const navigate = useNavigate()
  const router = useRouter()
  const { user, isLoading: isAuthLoading } = useAuth()

  // We use a minimal hook instance just for mutations (no pagination needed here)
  const { onUpdate, onDelete } = useEquipment({ page: 1 })

  const [equipment, setEquipment] = useState<Equipment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (!equipmentId) return
    setIsLoading(true)
    setFetchError(null)
    getEquipmentById(equipmentId)
      .then((data) => {
        if (!data) setFetchError('Equipo no encontrado.')
        else setEquipment(data)
      })
      .catch((err: unknown) =>
        setFetchError(
          err instanceof Error ? err.message : 'Error al cargar equipo.'
        )
      )
      .finally(() => setIsLoading(false))
  }, [equipmentId])

  if (!isAuthLoading && !user) {
    void navigate({ to: '/' })
    return null
  }

  const handleSave = async (values: EquipmentFormValues) => {
    if (!equipment) return
    setIsSaving(true)
    setSaveError(null)
    try {
      await onUpdate(equipment.id, values)
      // Refresh local state with updated data
      const updated = await getEquipmentById(equipment.id)
      if (updated) setEquipment(updated)
      setIsModalOpen(false)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error al guardar.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!equipment) return
    setIsDeleting(true)
    try {
      await onDelete(equipment.id)
      void navigate({ to: '/equipo' })
    } catch {
      setIsDeleting(false)
    }
  }

  const handleBack = () => {
    if (router.history.length > 1) {
      router.history.back()
    } else {
      void navigate({ to: '/equipo' })
    }
  }

  return (
    <DashboardLayout>
      {isLoading ? (
        <div className='flex h-64 items-center justify-center'>
          <span className='material-symbols-outlined animate-spin text-[36px] font-normal text-slate-400'>
            progress_activity
          </span>
        </div>
      ) : fetchError ? (
        <div className='rounded-lg border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-600 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400'>
          {fetchError}
        </div>
      ) : equipment ? (
        <>
          <EquipmentDetailView
            equipment={equipment}
            onEdit={() => {
              setSaveError(null)
              setIsModalOpen(true)
            }}
            onDelete={() => void handleDelete()}
            onBack={handleBack}
            isDeleting={isDeleting}
          />

          <EquipmentFormModal
            equipment={equipment}
            isOpen={isModalOpen}
            isSaving={isSaving}
            error={saveError}
            onClose={() => setIsModalOpen(false)}
            onSave={async (values) => {
              await handleSave(values)
            }}
          />
        </>
      ) : null}
    </DashboardLayout>
  )
}
