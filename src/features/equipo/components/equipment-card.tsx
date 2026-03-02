import type { Equipment, EquipmentType } from '../types'

interface EquipmentCardProps {
  item: Equipment
  onClick: () => void
}

const TYPE_LABELS: Record<EquipmentType, string> = {
  camara: 'Cámara',
  lente: 'Lente',
  iluminacion: 'Iluminación',
  tramoya: 'Tramoya',
  audio: 'Audio',
  video: 'Video',
  estudio: 'Estudio',
  otros_accesorios: 'Otros Accesorios',
}

const TYPE_ICONS: Record<EquipmentType, string> = {
  camara: 'videocam',
  lente: 'camera',
  iluminacion: 'light_mode',
  tramoya: 'handyman',
  audio: 'mic',
  video: 'movie',
  estudio: 'domain',
  otros_accesorios: 'devices',
}

const STATUS_CONFIG = {
  disponible: {
    dot: 'bg-emerald-500',
    label: 'Disponible',
    bar: 'bg-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  mantenimiento: {
    dot: 'bg-amber-500',
    label: 'Mantenimiento',
    bar: 'bg-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
  },
  no_disponible: {
    dot: 'bg-red-500',
    label: 'No Disponible',
    bar: 'bg-red-500',
    text: 'text-red-600 dark:text-red-400',
  },
}

/**
 * Sleek equipment card — clicking navigates to the detail view.
 * No edit/delete actions here; those live in the detail page.
 */
export function EquipmentCard({ item, onClick }: EquipmentCardProps) {
  const status = STATUS_CONFIG[item.status]

  return (
    <button
      type='button'
      onClick={onClick}
      className='group relative flex w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none dark:border-slate-700 dark:bg-slate-800'
    >
      {/* Status bar accent at top */}
      <div className={`h-1 w-full ${status.bar} opacity-80`} />

      {/* Image / icon hero */}
      {item.image_url ? (
        <div className='relative h-44 w-full overflow-hidden bg-slate-100 dark:bg-slate-700'>
          <img
            src={item.image_url}
            alt={item.name}
            className='h-full w-full object-cover transition-transform duration-300 group-hover:scale-105'
          />
          {/* Gradient overlay for legibility */}
          <div className='absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent' />
          {/* Type badge floating on image */}
          <span className='absolute bottom-3 left-3 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm'>
            {TYPE_LABELS[item.type]}
          </span>
        </div>
      ) : (
        <div className='flex h-36 w-full items-center justify-center bg-slate-50 dark:bg-slate-700/40'>
          <div className='flex flex-col items-center gap-1'>
            <span className='material-symbols-outlined text-[48px] font-normal text-slate-300 transition-transform duration-200 group-hover:scale-110 dark:text-slate-500'>
              {TYPE_ICONS[item.type]}
            </span>
            <span className='text-[11px] font-semibold tracking-wider text-slate-400 uppercase dark:text-slate-500'>
              {TYPE_LABELS[item.type]}
            </span>
          </div>
        </div>
      )}

      {/* Card body */}
      <div className='flex flex-1 flex-col gap-3 p-4'>
        {/* Name */}
        <div>
          <h3 className='truncate text-[15px] leading-tight font-bold text-slate-800 dark:text-white'>
            {item.name}
          </h3>
          {item.description && (
            <p className='mt-1 line-clamp-2 text-xs text-slate-400 dark:text-slate-500'>
              {item.description}
            </p>
          )}
        </div>

        {/* Status row */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-1.5'>
            <span className={`size-2 rounded-full ${status.dot}`} />
            <span className={`text-xs font-semibold ${status.text}`}>
              {status.label}
            </span>
          </div>

          {/* "View" affordance */}
          <span className='flex items-center gap-0.5 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-400 opacity-0 transition-all duration-200 group-hover:bg-slate-100 group-hover:text-slate-600 group-hover:opacity-100 dark:group-hover:bg-slate-700 dark:group-hover:text-slate-200'>
            Ver detalle
            <span className='material-symbols-outlined text-[14px] font-normal'>
              chevron_right
            </span>
          </span>
        </div>
      </div>
    </button>
  )
}
