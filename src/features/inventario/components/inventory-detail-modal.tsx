import { useState } from 'react'
import { deleteInventoryMovement } from '../api/delete-inventory'
import { updateInventoryMovement } from '../api/update-inventory'
import type {
  InventoryFormValues,
  InventoryMovement,
  MovementType,
} from '../types'

interface InventoryDetailModalProps {
  movement: InventoryMovement
  equipmentOptions: { id: string; name: string }[]
  onClose: () => void
  onDeleted: () => void
  onUpdated: (updated: InventoryMovement) => void
}

const MOVEMENT_CONFIG: Record<
  MovementType,
  { label: string; icon: string; classes: string; dot: string }
> = {
  in: {
    label: 'Entrada',
    icon: 'arrow_downward',
    classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  out: {
    label: 'Salida',
    icon: 'arrow_upward',
    classes: 'bg-red-50 text-red-700 border-red-200',
    dot: 'bg-red-500',
  },
  adjustment: {
    label: 'Ajuste',
    icon: 'tune',
    classes: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
  },
}

const MOVEMENT_LABELS: Record<MovementType, string> = {
  in: 'Entrada',
  out: 'Salida',
  adjustment: 'Ajuste',
}

/**
 * Backdrop-blur modal overlay showing the full details of an inventory movement.
 * Supports inline editing and deletion.
 */
export function InventoryDetailModal({
  movement: initial,
  equipmentOptions,
  onClose,
  onDeleted,
  onUpdated,
}: InventoryDetailModalProps) {
  const [movement, setMovement] = useState<InventoryMovement>(initial)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<InventoryFormValues>({
    equipment_id: movement.equipment_id,
    date: movement.date.slice(0, 10),
    movement_type: movement.movement_type,
    quantity: movement.quantity,
    clasification: movement.clasification ?? '',
    description: movement.description ?? '',
  })

  const cfg = MOVEMENT_CONFIG[movement.movement_type]

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    try {
      const updated = await updateInventoryMovement(movement.id, form)
      setMovement({
        ...updated,
        equipment_name: equipmentOptions.find(
          (e) => e.id === updated.equipment_id
        )?.name,
      })
      setIsEditing(false)
      onUpdated({
        ...updated,
        equipment_name: equipmentOptions.find(
          (e) => e.id === updated.equipment_id
        )?.name,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteInventoryMovement(movement.id)
      onDeleted()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar.')
      setIsDeleting(false)
    }
  }

  const inputClass =
    'block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white'

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm'
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSaving && !isDeleting) onClose()
      }}
    >
      <div className='relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800'>
        {/* Close */}
        <button
          onClick={onClose}
          disabled={isSaving || isDeleting}
          className='absolute top-4 right-4 flex size-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 disabled:opacity-40 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
        >
          <span className='material-symbols-outlined text-[18px] font-normal'>
            close
          </span>
        </button>

        <div className='space-y-5 p-6'>
          {/* Header */}
          <div className='flex items-center gap-3 pr-10'>
            <div
              className={`flex size-11 shrink-0 items-center justify-center rounded-xl border ${cfg.classes}`}
            >
              <span className='material-symbols-outlined text-[22px] font-normal'>
                {cfg.icon}
              </span>
            </div>
            <div>
              <h2 className='text-lg font-bold text-slate-900 dark:text-white'>
                {movement.equipment_name ?? '—'}
              </h2>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${cfg.classes}`}
              >
                <span className={`size-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </span>
            </div>
          </div>

          <div className='h-px bg-slate-100 dark:bg-slate-700' />

          {/* Detail fields / Edit form */}
          {isEditing ? (
            <div className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='mb-1.5 block text-xs font-semibold tracking-wider text-slate-500 uppercase'>
                    Equipo
                  </label>
                  <select
                    value={form.equipment_id}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, equipment_id: e.target.value }))
                    }
                    className={inputClass}
                  >
                    {equipmentOptions.map((eq) => (
                      <option key={eq.id} value={eq.id}>
                        {eq.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className='mb-1.5 block text-xs font-semibold tracking-wider text-slate-500 uppercase'>
                    Tipo
                  </label>
                  <select
                    value={form.movement_type}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        movement_type: e.target.value as MovementType,
                      }))
                    }
                    className={inputClass}
                  >
                    {(
                      Object.entries(MOVEMENT_LABELS) as [
                        MovementType,
                        string,
                      ][]
                    ).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className='mb-1.5 block text-xs font-semibold tracking-wider text-slate-500 uppercase'>
                    Cantidad
                  </label>
                  <input
                    type='number'
                    min={1}
                    value={form.quantity}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        quantity: Number(e.target.value),
                      }))
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className='mb-1.5 block text-xs font-semibold tracking-wider text-slate-500 uppercase'>
                    Fecha
                  </label>
                  <input
                    type='date'
                    value={form.date}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, date: e.target.value }))
                    }
                    className={inputClass}
                  />
                </div>
                <div className='col-span-2'>
                  <label className='mb-1.5 block text-xs font-semibold tracking-wider text-slate-500 uppercase'>
                    Clasificación
                  </label>
                  <input
                    type='text'
                    value={form.clasification}
                    placeholder='Ej. Compra, Préstamo...'
                    onChange={(e) =>
                      setForm((f) => ({ ...f, clasification: e.target.value }))
                    }
                    className={inputClass}
                  />
                </div>
                <div className='col-span-2'>
                  <label className='mb-1.5 block text-xs font-semibold tracking-wider text-slate-500 uppercase'>
                    Descripción
                  </label>
                  <input
                    type='text'
                    value={form.description}
                    placeholder='Notas adicionales...'
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          ) : (
            <dl className='grid grid-cols-2 gap-x-6 gap-y-4'>
              <DetailField
                label='Cantidad'
                value={`${movement.movement_type === 'out' ? '-' : '+'}${movement.quantity}`}
              />
              <DetailField
                label='Fecha'
                value={new Date(movement.date).toLocaleDateString('es-MX', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              />
              {movement.clasification && (
                <DetailField
                  label='Clasificación'
                  value={movement.clasification}
                />
              )}
              {movement.description && (
                <DetailField
                  label='Descripción'
                  value={movement.description}
                  wide
                />
              )}
            </dl>
          )}

          {error && (
            <div className='rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400'>
              {error}
            </div>
          )}

          <div className='h-px bg-slate-100 dark:bg-slate-700' />

          {/* Actions */}
          {isEditing ? (
            <div className='flex gap-3'>
              <button
                onClick={() => {
                  setIsEditing(false)
                  setError(null)
                }}
                disabled={isSaving}
                className='flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700'
              >
                Cancelar
              </button>
              <button
                onClick={() => void handleSave()}
                disabled={isSaving}
                className='bg-primary hover:bg-primary-hover flex-1 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow transition disabled:opacity-60'
              >
                {isSaving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          ) : (
            <div className='flex gap-3'>
              <button
                onClick={() => void handleDelete()}
                disabled={isDeleting}
                className='flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-60 dark:border-red-800/30 dark:bg-red-900/20 dark:text-red-400'
              >
                <span className='material-symbols-outlined text-[18px] font-normal'>
                  delete
                </span>
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className='bg-primary hover:bg-primary-hover flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow transition active:scale-[0.98]'
              >
                <span className='material-symbols-outlined text-[18px] font-normal'>
                  edit
                </span>
                Editar movimiento
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/** Small read-only field in the detail view. */
function DetailField({
  label,
  value,
  wide = false,
}: {
  label: string
  value: string
  wide?: boolean
}) {
  return (
    <div className={wide ? 'col-span-2' : ''}>
      <dt className='text-xs font-semibold tracking-wider text-slate-400 uppercase dark:text-slate-500'>
        {label}
      </dt>
      <dd className='mt-1 text-sm font-medium text-slate-700 dark:text-slate-300'>
        {value}
      </dd>
    </div>
  )
}
