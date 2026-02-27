import { useEffect, useRef, useState } from 'react'
import type { Equipment, EquipmentFormValues, EquipmentStatus } from '../types'

interface EquipmentFormModalProps {
  equipment: Equipment | null
  isOpen: boolean
  isSaving: boolean
  error: string | null
  onClose: () => void
  onSave: (values: EquipmentFormValues) => Promise<void>
}

const STATUS_LABELS: Record<EquipmentStatus, string> = {
  available: 'Disponible',
  maintenance: 'Mantenimiento',
  retired: 'Retirado',
}

/**
 * Modal for creating or editing an equipment item.
 * Resets fields whenever the `equipment` prop changes.
 */
export function EquipmentFormModal({
  equipment,
  isOpen,
  isSaving,
  error,
  onClose,
  onSave,
}: EquipmentFormModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('')
  const [status, setStatus] = useState<EquipmentStatus>('available')
  const [quantity, setQuantity] = useState(1)
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setName(equipment?.name ?? '')
    setDescription(equipment?.description ?? '')
    setType(equipment?.type ?? '')
    setStatus(equipment?.status ?? 'available')
    setQuantity(equipment?.quantity ?? 1)
    if (isOpen) setTimeout(() => nameRef.current?.focus(), 50)
  }, [equipment, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSave({ name, description, type, status, quantity })
  }

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm'
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className='relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-2xl dark:border-slate-700 dark:bg-slate-800'>
        {/* Close */}
        <button onClick={onClose} className='absolute top-4 right-4 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700'>
          <span className='material-symbols-outlined text-[20px] font-normal'>close</span>
        </button>

        {/* Header */}
        <div className='mb-6 flex items-center gap-3'>
          <div className='flex size-12 items-center justify-center rounded-xl bg-slate-900 text-white shadow-lg dark:bg-slate-700'>
            <span className='material-symbols-outlined text-2xl font-normal'>
              {equipment ? 'edit' : 'add_circle'}
            </span>
          </div>
          <div>
            <h2 className='text-xl font-bold text-slate-900 dark:text-white'>
              {equipment ? 'Editar Equipo' : 'Nuevo Equipo'}
            </h2>
            <p className='text-sm text-slate-500 dark:text-slate-400'>
              {equipment ? 'Actualiza la información del equipo.' : 'Agrega un nuevo artículo al inventario.'}
            </p>
          </div>
        </div>

        {/* Form */}
        <form className='space-y-4' onSubmit={(e) => void handleSubmit(e)}>
          <div>
            <label htmlFor='equip-name' className='mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200'>
              Nombre <span className='text-red-500'>*</span>
            </label>
            <input id='equip-name' ref={nameRef} type='text' required value={name} onChange={(e) => setName(e.target.value)} disabled={isSaving}
              className='block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-none disabled:opacity-60 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-500'
              placeholder='Ej. Sony FX3 #1' />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label htmlFor='equip-type' className='mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200'>
                Tipo <span className='text-red-500'>*</span>
              </label>
              <input id='equip-type' type='text' required value={type} onChange={(e) => setType(e.target.value)} disabled={isSaving}
                className='block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-none disabled:opacity-60 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-500'
                placeholder='Cámara, Luz, Grip...' />
            </div>
            <div>
              <label htmlFor='equip-quantity' className='mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200'>
                Cantidad <span className='text-red-500'>*</span>
              </label>
              <input id='equip-quantity' type='number' min={1} required value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} disabled={isSaving}
                className='block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-none disabled:opacity-60 dark:border-slate-600 dark:bg-slate-700 dark:text-white' />
            </div>
          </div>

          <div>
            <label htmlFor='equip-description' className='mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200'>
              Descripción
            </label>
            <textarea id='equip-description' rows={2} value={description} onChange={(e) => setDescription(e.target.value)} disabled={isSaving}
              className='block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-none disabled:opacity-60 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-500'
              placeholder='Detalles adicionales del equipo...' />
          </div>

          <div>
            <label htmlFor='equip-status' className='mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200'>
              Estado <span className='text-red-500'>*</span>
            </label>
            <select id='equip-status' required value={status} onChange={(e) => setStatus(e.target.value as EquipmentStatus)} disabled={isSaving}
              className='block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-none disabled:opacity-60 dark:border-slate-600 dark:bg-slate-700 dark:text-white'>
              {(Object.entries(STATUS_LABELS) as [EquipmentStatus, string][]).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          {error && (
            <div className='rounded-lg border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-600 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400'>
              {error}
            </div>
          )}

          <div className='flex gap-3 pt-2'>
            <button type='button' onClick={onClose} disabled={isSaving}
              className='flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700'>
              Cancelar
            </button>
            <button type='submit' disabled={isSaving || !name.trim() || !type.trim()}
              className='bg-primary hover:bg-primary-hover flex-1 rounded-lg px-4 py-2.5 text-sm font-bold text-white shadow transition-colors disabled:opacity-60'>
              {isSaving ? 'Guardando...' : equipment ? 'Guardar Cambios' : 'Agregar Equipo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
