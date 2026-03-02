import type { Equipment, EquipmentType } from '../types'

interface EquipmentDetailViewProps {
  equipment: Equipment
  onEdit: () => void
  onDelete: () => void
  onBack: () => void
  isDeleting?: boolean
  /** When true, hides the "← Volver" back button (used when rendered inside a modal). */
  hideBackButton?: boolean
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
    classes:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/30',
  },
  mantenimiento: {
    dot: 'bg-amber-500',
    label: 'Mantenimiento',
    classes:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/30',
  },
  no_disponible: {
    dot: 'bg-red-500',
    label: 'No Disponible',
    classes:
      'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800/30',
  },
}

/**
 * Full detail view for a single equipment item.
 * Shows all metadata and exposes Edit + Delete actions.
 */
export function EquipmentDetailView({
  equipment: item,
  onEdit,
  onDelete,
  onBack,
  isDeleting = false,
  hideBackButton = false,
}: EquipmentDetailViewProps) {
  const status = STATUS_CONFIG[item.status]

  return (
    <div className='space-y-4'>
      {/* Back button — hidden when rendered inside a modal */}
      {!hideBackButton && (
        <button
          onClick={onBack}
          className='flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
        >
          <span className='material-symbols-outlined text-[20px] font-normal'>
            arrow_back
          </span>
          Volver al inventario
        </button>
      )}

      {/* Hero card */}
      <div className='overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800'>
        {/* Image hero */}
        {item.image_url ? (
          <div className='relative h-72 w-full overflow-hidden bg-slate-100 dark:bg-slate-700'>
            <img
              src={item.image_url}
              alt={item.name}
              className='h-full w-full object-cover'
            />
            <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent' />
            {/* Name overlay */}
            <div className='absolute right-0 bottom-0 left-0 p-6'>
              <span className='mb-2 inline-flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm'>
                <span className='material-symbols-outlined text-[14px] font-normal'>
                  {TYPE_ICONS[item.type]}
                </span>
                {TYPE_LABELS[item.type]}
              </span>
              <h1 className='text-2xl font-bold text-white drop-shadow-sm'>
                {item.name}
              </h1>
            </div>
          </div>
        ) : (
          <div className='flex h-48 w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800'>
            <div className='flex flex-col items-center gap-2'>
              <span className='material-symbols-outlined text-[64px] font-normal text-slate-300 dark:text-slate-500'>
                {TYPE_ICONS[item.type]}
              </span>
              <span className='text-sm font-semibold text-slate-400 dark:text-slate-500'>
                {TYPE_LABELS[item.type]}
              </span>
            </div>
          </div>
        )}

        {/* Info body */}
        <div className='space-y-6 p-6'>
          {/* Name (when no image) */}
          {!item.image_url && (
            <div>
              <h1 className='text-2xl font-bold text-slate-900 dark:text-white'>
                {item.name}
              </h1>
            </div>
          )}

          {/* Status badge */}
          <div className='flex items-center gap-3'>
            <span
              className={`flex items-center gap-2 rounded-full border px-3.5 py-1 text-sm font-bold ${status.classes}`}
            >
              <span className={`size-2 rounded-full ${status.dot}`} />
              {status.label}
            </span>
          </div>

          {/* Metadata grid */}
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            <DetailField
              icon='category'
              label='Tipo'
              value={TYPE_LABELS[item.type]}
            />
            {item.description && (
              <DetailField
                icon='notes'
                label='Descripción'
                value={item.description}
                wide
              />
            )}
            <DetailField
              icon='calendar_today'
              label='Registrado el'
              value={new Date(item.created_at).toLocaleDateString('es-MX', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            />
            {item.updated_at && (
              <DetailField
                icon='update'
                label='Última actualización'
                value={new Date(item.updated_at).toLocaleDateString('es-MX', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              />
            )}
          </div>

          {/* Divider */}
          <div className='h-px bg-slate-100 dark:bg-slate-700' />

          {/* Actions */}
          <div className='flex flex-col gap-3 sm:flex-row sm:justify-end'>
            <button
              onClick={onDelete}
              disabled={isDeleting}
              className='flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-bold text-red-600 transition-all hover:bg-red-100 disabled:opacity-60 dark:border-red-800/30 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30'
            >
              <span className='material-symbols-outlined text-[18px] font-normal'>
                delete
              </span>
              {isDeleting ? 'Eliminando...' : 'Eliminar equipo'}
            </button>
            <button
              onClick={onEdit}
              className='bg-primary hover:bg-primary-hover flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white shadow transition-all hover:shadow-md active:scale-[0.98]'
            >
              <span className='material-symbols-outlined text-[18px] font-normal'>
                edit
              </span>
              Editar equipo
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/** A single label+value metadata field. */
function DetailField({
  icon,
  label,
  value,
  wide = false,
}: {
  icon: string
  label: string
  value: string
  wide?: boolean
}) {
  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <div className='flex items-center gap-1.5 text-xs font-semibold tracking-wider text-slate-400 uppercase dark:text-slate-500'>
        <span className='material-symbols-outlined text-[14px] font-normal'>
          {icon}
        </span>
        {label}
      </div>
      <p className='mt-1 text-sm font-medium text-slate-700 dark:text-slate-300'>
        {value}
      </p>
    </div>
  )
}
