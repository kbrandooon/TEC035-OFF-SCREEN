import type { Equipment } from '../types'
import { EquipmentCard } from './equipment-card'

interface EquipmentListProps {
  equipment: Equipment[]
  onSelect: (item: Equipment) => void
}

/**
 * Renders the equipment grid using the redesigned EquipmentCard.
 * Clicking a card navigates to the detail view via onSelect.
 */
export function EquipmentList({ equipment, onSelect }: EquipmentListProps) {
  if (equipment.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/50 py-20 text-center dark:border-slate-700 dark:bg-slate-800/20'>
        <span className='material-symbols-outlined mb-3 text-[52px] font-normal text-slate-300 dark:text-slate-600'>
          videocam_off
        </span>
        <p className='text-sm font-semibold text-slate-500 dark:text-slate-400'>
          Aún no hay equipo registrado.
        </p>
        <p className='mt-1 text-xs text-slate-400 dark:text-slate-500'>
          Haz clic en "Nuevo Equipo" para agregar el primero.
        </p>
      </div>
    )
  }

  return (
    <div className='grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3'>
      {equipment.map((item) => (
        <EquipmentCard
          key={item.id}
          item={item}
          onClick={() => onSelect(item)}
        />
      ))}
    </div>
  )
}
