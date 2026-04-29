import { useState } from 'react'
import { toast } from 'sonner'
import { deleteEquipment } from '../api/delete-equipment'
import { getEquipmentById } from '../api/get-equipment-by-id'
import { updateEquipment } from '../api/update-equipment'
import type { Equipment, EquipmentFormValues } from '../types'
import { EquipmentDetailView } from './equipment-detail-view'
import { EquipmentFormModal } from './equipment-form-modal'

interface EquipmentDetailModalProps {
  equipment: Equipment
  onClose: () => void
  onDeleted: () => void
  onUpdated: (updated: Equipment) => void
}

/**
 * Wraps EquipmentDetailView in a centered modal overlay with backdrop blur.
 * Handles edit (form modal) and delete locally, then propagates results upward.
 */
export function EquipmentDetailModal({
  equipment: initial,
  onClose,
  onDeleted,
  onUpdated,
}: EquipmentDetailModalProps) {
  const [equipment, setEquipment] = useState<Equipment>(initial)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const handleSave = async (values: EquipmentFormValues) => {
    setIsSaving(true)
    setSaveError(null)
    try {
      await updateEquipment(equipment.id, values)
      const updated = await getEquipmentById(equipment.id)
      if (updated) {
        setEquipment(updated)
        onUpdated(updated)
      }
      setIsEditOpen(false)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error al guardar.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteEquipment(equipment.id)
      onDeleted()
      onClose()
    } catch (err) {
      setIsDeleting(false)
      toast.error(err instanceof Error ? err.message : 'Error al eliminar el equipo.')
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm'
        onClick={(e) => {
          if (e.target === e.currentTarget && !isSaving && !isDeleting)
            onClose()
        }}
      >
        {/* Panel */}
        <div className='relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl shadow-2xl'>
          {/* Close button */}
          <button
            onClick={onClose}
            disabled={isSaving || isDeleting}
            className='absolute top-3 right-3 z-10 flex size-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70 disabled:opacity-40'
          >
            <span className='material-symbols-outlined text-[18px] font-normal'>
              close
            </span>
          </button>

          <EquipmentDetailView
            equipment={equipment}
            onBack={onClose}
            onEdit={() => {
              setSaveError(null)
              setIsEditOpen(true)
            }}
            onDelete={() => void handleDelete()}
            isDeleting={isDeleting}
            hideBackButton
          />
        </div>
      </div>

      {/* Edit form modal — stacked above the detail overlay */}
      <EquipmentFormModal
        equipment={equipment}
        isOpen={isEditOpen}
        isSaving={isSaving}
        error={saveError}
        onClose={() => setIsEditOpen(false)}
        onSave={async (values) => {
          await handleSave(values)
        }}
      />
    </>
  )
}
