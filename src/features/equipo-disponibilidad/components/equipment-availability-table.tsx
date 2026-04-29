import type { EquipmentType } from '@/features/equipo'
import type { EquipmentAvailabilityResult } from '../types'

// ── Icon map: equipment type → Material Symbol ────────────────────────────────

const TYPE_ICON: Record<EquipmentType, string> = {
  camara: 'photo_camera',
  lente: 'lens',
  iluminacion: 'light_mode',
  tramoya: 'settings',
  audio: 'mic',
  video: 'videocam',
  estudio: 'meeting_room',
  otros_accesorios: 'category',
}

const TYPE_LABEL: Record<EquipmentType, string> = {
  camara: 'Cámara',
  lente: 'Lente',
  iluminacion: 'Iluminación',
  tramoya: 'Tramoya',
  audio: 'Audio',
  video: 'Video',
  estudio: 'Estudio',
  otros_accesorios: 'Accesorios',
}

// ── Utilization bar ───────────────────────────────────────────────────────────

function UtilizationBar({
  committed,
  total,
}: {
  committed: number
  total: number
}) {
  const pct = total > 0 ? Math.round((committed / total) * 100) : 0
  const available = Math.max(total - committed, 0)
  const isFull = pct >= 100

  return (
    <div className='flex min-w-[220px] flex-col gap-1.5'>
      {/* Labels */}
      <div className='flex items-center justify-between text-[11px] font-bold tracking-wide uppercase'>
        <span
          className={
            isFull ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'
          }
        >
          {pct}% usado
        </span>
        <span
          className={
            available === 0
              ? 'text-red-500'
              : 'text-emerald-600 dark:text-emerald-400'
          }
        >
          {available} disponible
        </span>
      </div>
      {/* Bar */}
      <div className='h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700'>
        <div
          className={[
            'h-full rounded-full transition-all duration-500',
            isFull ? 'bg-red-500' : 'bg-emerald-500',
          ].join(' ')}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  )
}

// ── Empty / loading states ────────────────────────────────────────────────────

interface EquipmentAvailabilityTableProps {
  results: EquipmentAvailabilityResult[]
  isLoading: boolean
  canQuery: boolean
}

/**
 * Redesigned results table for the Equipment Availability panel.
 *
 * Columns: Type Icon + Name / Category Badge / Total / Booked / Utilization bar.
 * Rows with 100% usage show a red bar; others show blue.
 */
export function EquipmentAvailabilityTable({
  results,
  isLoading,
  canQuery,
}: EquipmentAvailabilityTableProps) {
  if (!canQuery) {
    return (
      <div className='flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-200 py-16 text-slate-400 dark:border-slate-700'>
        <span className='material-symbols-outlined text-[40px] font-normal'>
          event_available
        </span>
        <p className='text-sm font-medium'>
          Selecciona un rango de fechas para consultar disponibilidad
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className='flex flex-col items-center justify-center gap-3 py-16 text-slate-400'>
        <span className='material-symbols-outlined animate-spin text-[40px] font-normal text-slate-500'>
          progress_activity
        </span>
        <p className='text-sm font-medium'>Calculando disponibilidad...</p>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-200 py-16 text-slate-400 dark:border-slate-700'>
        <span className='material-symbols-outlined text-[40px] font-normal'>
          inventory_2
        </span>
        <p className='text-sm font-medium'>
          No hay equipo disponible para este rango
        </p>
      </div>
    )
  }

  return (
    <div className='overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'>
      <table className='w-full text-sm'>
        <thead>
          <tr className='border-b border-slate-200 dark:border-slate-700'>
            <th className='px-4 py-3 text-left text-xs font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500'>
              Equipo
            </th>
            <th className='px-4 py-3 text-left text-xs font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500'>
              Categoría
            </th>
            <th className='px-4 py-3 text-center text-xs font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500'>
              Total
            </th>
            <th className='px-4 py-3 text-center text-xs font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500'>
              Reservado
            </th>
            <th className='px-4 py-3 text-left text-xs font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500'>
              Utilización y Disponibilidad
            </th>
          </tr>
        </thead>
        <tbody className='divide-y divide-slate-100 dark:divide-slate-800'>
          {results.map((row) => {
            const icon = TYPE_ICON[row.type as EquipmentType] ?? 'devices'
            const label = TYPE_LABEL[row.type as EquipmentType] ?? row.type
            const isFull = row.available === 0

            return (
              <tr
                key={row.id}
                className='group transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40'
              >
                {/* Name + icon */}
                <td className='px-4 py-4'>
                  <div className='flex items-center gap-3'>
                    <div className='flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'>
                      <span className='material-symbols-outlined text-[20px] font-normal'>
                        {icon}
                      </span>
                    </div>
                    <span className='font-semibold text-slate-800 dark:text-slate-100'>
                      {row.name}
                    </span>
                  </div>
                </td>

                {/* Category badge */}
                <td className='px-4 py-4'>
                  <span className='rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300'>
                    {label.toUpperCase()}
                  </span>
                </td>

                {/* Total */}
                <td className='px-4 py-4 text-center font-medium text-slate-700 dark:text-slate-300'>
                  {row.quantity}
                </td>

                {/* Committed — highlighted */}
                <td className='px-4 py-4 text-center'>
                  <span
                    className={[
                      'text-lg font-bold',
                      isFull
                        ? 'text-red-500'
                        : row.committed > 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-400',
                    ].join(' ')}
                  >
                    {row.committed}
                  </span>
                </td>

                {/* Utilization bar */}
                <td className='px-4 py-4'>
                  <UtilizationBar
                    committed={row.committed}
                    total={row.quantity}
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Footer count */}
      <div className='border-t border-slate-100 px-4 py-3 dark:border-slate-800'>
        <p className='text-xs text-slate-400'>
          Mostrando{' '}
          <span className='font-semibold text-slate-600 dark:text-slate-300'>
            {results.length}
          </span>{' '}
          {results.length === 1 ? 'equipo' : 'equipos'} activos
        </p>
      </div>
    </div>
  )
}
