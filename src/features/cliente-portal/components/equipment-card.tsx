import { Link } from '@tanstack/react-router'
import type { MarketplaceEquipment } from '../types'

const TYPE_LABEL: Record<string, string> = {
  camara: 'Cámaras',
  lente: 'Lentes',
  iluminacion: 'Iluminación',
  audio: 'Audio',
  tramoya: 'Grip',
  estudio: 'Estudio',
  video: 'Video',
  otros_accesorios: 'Accesorios',
}

const TYPE_COLOR: Record<string, string> = {
  camara: 'text-blue-600 bg-blue-50',
  lente: 'text-purple-600 bg-purple-50',
  iluminacion: 'text-amber-600 bg-amber-50',
  audio: 'text-emerald-600 bg-emerald-50',
  tramoya: 'text-rose-600 bg-rose-50',
  estudio: 'text-slate-600 bg-slate-100',
  video: 'text-cyan-600 bg-cyan-50',
  otros_accesorios: 'text-slate-500 bg-slate-100',
}

interface EquipmentCardProps {
  item: MarketplaceEquipment
  view?: 'grid' | 'list'
}

/**
 * Displays a single equipment item in the marketplace grid or list.
 * Clicking navigates to the detail page where the user can add to cart.
 *
 * @param item - The equipment data to display.
 * @param view - Layout variant: 'grid' (default) or 'list'.
 */
export function EquipmentCard({ item, view = 'grid' }: EquipmentCardProps) {
  const typeLabel = TYPE_LABEL[item.type] ?? item.type
  const typeColor = TYPE_COLOR[item.type] ?? 'text-slate-500 bg-slate-100'

  if (view === 'list') {
    return (
      <Link
        to='/cliente/equipo/$equipmentId'
        params={{ equipmentId: item.id }}
        className='group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md'
      >
        {/* Image */}
        <div className='size-20 shrink-0 overflow-hidden rounded-lg bg-slate-100'>
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              className='size-full object-cover'
            />
          ) : (
            <div className='flex size-full items-center justify-center'>
              <span className='material-symbols-outlined text-[32px] text-slate-300'>
                videocam
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className='min-w-0 flex-1'>
          <span
            className={`mb-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase ${typeColor}`}
          >
            {typeLabel}
          </span>
          <p className='truncate font-semibold text-slate-900 group-hover:text-slate-700'>
            {item.name}
          </p>
          <p className='text-xs text-slate-400'>{item.tenant_name}</p>
        </div>

        {/* Price */}
        <div className='shrink-0'>
          <span className='text-lg font-bold text-slate-900'>
            ${item.daily_rate.toLocaleString('en-MX')}
          </span>
          <span className='text-xs text-slate-400'> /día</span>
        </div>
      </Link>
    )
  }

  return (
    <Link
      to='/cliente/equipo/$equipmentId'
      params={{ equipmentId: item.id }}
      className='group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md'
    >
      {/* Image */}
      <div className='aspect-[4/3] overflow-hidden bg-slate-100'>
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className='size-full object-cover transition-transform duration-300 group-hover:scale-105'
          />
        ) : (
          <div className='flex size-full items-center justify-center'>
            <span className='material-symbols-outlined text-[48px] text-slate-300'>
              videocam
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className='flex flex-1 flex-col gap-1.5 p-4'>
        <span
          className={`inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase ${typeColor}`}
        >
          {typeLabel}
        </span>
        <p className='line-clamp-2 leading-snug font-semibold text-slate-900'>
          {item.name}
        </p>
        <p className='text-xs text-slate-400'>
          {item.tenant_name}
          {item.description && ` • ${item.description.slice(0, 40)}`}
        </p>

        {/* Price row */}
        <div className='mt-auto pt-3'>
          <span className='text-xl font-bold text-slate-900'>
            ${item.daily_rate.toLocaleString('en-MX')}
          </span>
          <span className='text-xs text-slate-400'> /día</span>
        </div>
      </div>
    </Link>
  )
}
