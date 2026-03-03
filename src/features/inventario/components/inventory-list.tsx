import type { InventoryMovement, MovementType } from '../types'

interface InventoryListProps {
  inventory: InventoryMovement[]
  /** Called when a row is clicked, opens the detail modal. */
  onSelect?: (movement: InventoryMovement) => void
}

const MOVEMENT_CONFIG: Record<
  MovementType,
  { label: string; icon: string; classes: string; dot: string }
> = {
  in: {
    label: 'Entrada',
    icon: 'arrow_downward',
    classes:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/30',
    dot: 'bg-emerald-500',
  },
  out: {
    label: 'Salida',
    icon: 'arrow_upward',
    classes:
      'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800/30',
    dot: 'bg-red-500',
  },
  adjustment: {
    label: 'Ajuste',
    icon: 'tune',
    classes:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/30',
    dot: 'bg-amber-500',
  },
}

/**
 * Renders the inventory movement log as a list.
 * Each row shows movement type, equipment, quantity, date and clasification.
 */
export function InventoryList({ inventory, onSelect }: InventoryListProps) {
  if (inventory.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/50 py-20 text-center dark:border-slate-700 dark:bg-slate-800/20'>
        <span className='material-symbols-outlined mb-3 text-[52px] font-normal text-slate-300 dark:text-slate-600'>
          inventory_2
        </span>
        <p className='text-sm font-semibold text-slate-500 dark:text-slate-400'>
          El registro de movimientos está vacío.
        </p>
        <p className='mt-1 text-xs text-slate-400 dark:text-slate-500'>
          Registra una entrada o salida para comenzar.
        </p>
      </div>
    )
  }

  return (
    <div className='bg-surface-light dark:bg-surface-dark overflow-hidden rounded-xl border border-slate-200 shadow-sm dark:border-slate-700'>
      <ul className='divide-y divide-slate-100 dark:divide-slate-700/50'>
        {inventory.map((movement) => {
          const cfg = MOVEMENT_CONFIG[movement.movement_type]
          return (
            <li
              key={movement.id}
              onClick={() => onSelect?.(movement)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onSelect?.(movement)
              }}
              role={onSelect ? 'button' : undefined}
              tabIndex={onSelect ? 0 : undefined}
              className={[
                'group flex items-center gap-4 px-6 py-4 transition-colors',
                onSelect
                  ? 'cursor-pointer hover:bg-slate-50 focus:bg-slate-50 focus:outline-none dark:hover:bg-slate-800/30'
                  : '',
              ].join(' ')}
            >
              {/* Movement type icon */}
              <div
                className={`flex size-10 shrink-0 items-center justify-center rounded-lg border ${cfg.classes}`}
              >
                <span className='material-symbols-outlined text-[20px] font-normal'>
                  {cfg.icon}
                </span>
              </div>

              {/* Info */}
              <div className='flex min-w-0 flex-1 flex-col'>
                <span className='truncate text-sm font-semibold text-slate-800 dark:text-white'>
                  {movement.equipment_name ?? '—'}
                </span>
                <div className='mt-0.5 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400'>
                  {movement.clasification && (
                    <span className='rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-xs font-medium dark:border-slate-700 dark:bg-slate-800'>
                      {movement.clasification}
                    </span>
                  )}
                  {movement.description && (
                    <span className='truncate'>{movement.description}</span>
                  )}
                </div>
              </div>

              {/* Date */}
              <span className='hidden text-xs text-slate-400 sm:block dark:text-slate-500'>
                {new Date(movement.date).toLocaleDateString('es-MX', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>

              {/* Quantity */}
              <span
                className={`flex items-center gap-1 rounded-full border px-3 py-1 text-sm font-bold ${cfg.classes}`}
              >
                <span className={`size-1.5 rounded-full ${cfg.dot}`} />
                {movement.movement_type === 'out' ? '-' : '+'}
                {movement.quantity}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
