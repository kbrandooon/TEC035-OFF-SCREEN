import { useState } from 'react'
import type { Equipment, EquipmentStatus } from '../types'

interface EquipmentListProps {
  equipment: Equipment[]
  onEdit: (item: Equipment) => void
  onDelete: (item: Equipment) => void
}

/** Returns Tailwind classes and label for a status pill. */
function statusBadge(status: EquipmentStatus): { classes: string; label: string; dot: string } {
  const map: Record<EquipmentStatus, { classes: string; label: string; dot: string }> = {
    available: {
      classes: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/30',
      label: 'Disponible',
      dot: 'bg-emerald-500',
    },
    maintenance: {
      classes: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/30',
      label: 'Mantenimiento',
      dot: 'bg-amber-500',
    },
    retired: {
      classes: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800/30',
      label: 'Retirado',
      dot: 'bg-red-500',
    },
  }
  return map[status]
}

/**
 * Renders the equipment inventory as a responsive grid of cards.
 * Each card shows name, type, description, quantity and status.
 */
export function EquipmentList({ equipment, onEdit, onDelete }: EquipmentListProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  if (equipment.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/50 py-20 text-center dark:border-slate-700 dark:bg-slate-800/20'>
        <span className='material-symbols-outlined mb-3 text-[52px] font-normal text-slate-300 dark:text-slate-600'>
          videocam_off
        </span>
        <p className='text-sm font-semibold text-slate-500 dark:text-slate-400'>Aún no hay equipo registrado.</p>
        <p className='mt-1 text-xs text-slate-400 dark:text-slate-500'>Haz clic en "Nuevo Equipo" para agregar el primero.</p>
      </div>
    )
  }

  return (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3'>
      {equipment.map((item) => {
        const status = statusBadge(item.status)
        return (
          <div
            key={item.id}
            className='bg-surface-light dark:bg-surface-dark flex flex-col rounded-xl border border-slate-200 p-5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700'
          >
            {/* Card header */}
            <div className='flex items-start justify-between gap-2'>
              <div className='flex items-center gap-3'>
                <div className='flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'>
                  <span className='material-symbols-outlined text-[22px] font-normal'>devices</span>
                </div>
                <div className='min-w-0'>
                  <p className='truncate text-sm font-bold text-slate-800 dark:text-white'>{item.name}</p>
                  <p className='text-xs text-slate-400 dark:text-slate-500'>{item.type}</p>
                </div>
              </div>

              {/* Actions */}
              <div className='flex shrink-0 items-center gap-1'>
                {confirmDeleteId === item.id ? (
                  <>
                    <button onClick={() => setConfirmDeleteId(null)} className='rounded px-1.5 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'>No</button>
                    <button onClick={() => { setConfirmDeleteId(null); onDelete(item) }} className='rounded bg-red-50 px-1.5 py-1 text-xs font-bold text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400'>Sí</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => onEdit(item)} className='rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-white' title='Editar'>
                      <span className='material-symbols-outlined text-[16px] font-normal'>edit</span>
                    </button>
                    <button onClick={() => setConfirmDeleteId(item.id)} className='rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400' title='Eliminar'>
                      <span className='material-symbols-outlined text-[16px] font-normal'>delete</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Description */}
            {item.description && (
              <p className='mt-3 text-xs text-slate-500 line-clamp-2 dark:text-slate-400'>{item.description}</p>
            )}

            {/* Badges */}
            <div className='mt-4 flex items-center gap-2'>
              <span className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold tracking-wide uppercase ${status.classes}`}>
                <span className={`size-1.5 rounded-full ${status.dot}`} />
                {status.label}
              </span>
              <span className='rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'>
                Cant: {item.quantity}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
