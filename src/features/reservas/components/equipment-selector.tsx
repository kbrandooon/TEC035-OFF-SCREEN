import { useState } from 'react'
import type { Equipment } from '@/features/equipo'
import type { ReservationEquipmentItem } from '../types'

interface EquipmentSelectorProps {
  availableEquipment: Equipment[]
  selectedItems: ReservationEquipmentItem[]
  onChange: (items: ReservationEquipmentItem[]) => void
  disabled?: boolean
}

const TYPE_LABELS: Record<string, string> = {
  camara: 'Cámara',
  lente: 'Lente',
  iluminacion: 'Iluminación',
  tramoya: 'Tramoya',
  audio: 'Audio',
  video: 'Video',
  estudio: 'Estudio',
  otros_accesorios: 'Otros',
}

const TYPE_ICONS: Record<string, string> = {
  camara: 'photo_camera',
  lente: 'camera',
  iluminacion: 'lightbulb',
  tramoya: 'settings_input_component',
  audio: 'mic',
  video: 'videocam',
  estudio: 'meeting_room',
  otros_accesorios: 'category',
}

/**
 * Cart-style equipment picker.
 * A "Agregar Equipo" button opens an overlay panel with all available items.
 * Each item can be added/removed from the cart, with a quantity stepper.
 * Selected items are shown as cards with image, name, rate, and quantity controls.
 */
export function EquipmentSelector({
  availableEquipment,
  selectedItems,
  onChange,
  disabled = false,
}: EquipmentSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [activeType, setActiveType] = useState<string | null>(null)

  const selectedIds = new Set(selectedItems.map((i) => i.equipmentId))

  // ── Filtered catalog ──────────────────────────────────────────────────────
  const filtered = availableEquipment.filter((e) => {
    const matchType = !activeType || e.type === activeType
    const matchSearch =
      !search.trim() || e.name.toLowerCase().includes(search.toLowerCase())
    return matchType && matchSearch
  })

  // ── Cart helpers ──────────────────────────────────────────────────────────
  const addItem = (equip: Equipment) => {
    if (selectedIds.has(equip.id)) return
    onChange([
      ...selectedItems,
      {
        equipmentId: equip.id,
        name: equip.name,
        quantity: 1,
        daily_rate: equip.daily_rate,
        image_url: equip.image_url,
      },
    ])
  }

  const removeItem = (equipmentId: string) =>
    onChange(selectedItems.filter((i) => i.equipmentId !== equipmentId))

  const updateQty = (equipmentId: string, qty: number) =>
    onChange(
      selectedItems.map((i) =>
        i.equipmentId === equipmentId ? { ...i, quantity: Math.max(1, qty) } : i
      )
    )

  // Unique types present in the catalog
  const presentTypes = Array.from(
    new Set(availableEquipment.map((e) => e.type))
  )

  return (
    <div className='space-y-3'>
      {/* ── Add Equipment button ─────────────────────────────────────────── */}
      <button
        type='button'
        onClick={() => setIsOpen(true)}
        disabled={disabled}
        className='flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 py-3 text-sm font-semibold text-slate-500 transition-all hover:border-[#2d3748]/50 hover:bg-white hover:text-[#2d3748] disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800/40 dark:hover:border-slate-400'
      >
        <span className='material-symbols-outlined text-[18px] font-normal'>
          add_shopping_cart
        </span>
        Agregar Equipo al Carrito
        {selectedItems.length > 0 && (
          <span className='ml-1 rounded-full bg-[#2d3748] px-2 py-0.5 text-[11px] font-bold text-white'>
            {selectedItems.length}
          </span>
        )}
      </button>

      {/* ── Selected items cart ──────────────────────────────────────────── */}
      {selectedItems.length > 0 && (
        <div className='space-y-2'>
          {selectedItems.map((item) => (
            <div
              key={item.equipmentId}
              className='flex items-center gap-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800/60'
            >
              {/* Thumbnail */}
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className='h-14 w-14 shrink-0 object-cover'
                />
              ) : (
                <div className='flex h-14 w-14 shrink-0 items-center justify-center bg-slate-100 dark:bg-slate-700'>
                  <span className='material-symbols-outlined text-[22px] font-normal text-slate-400'>
                    videocam
                  </span>
                </div>
              )}
              {/* Info */}
              <div className='min-w-0 flex-1'>
                <p className='truncate text-sm font-semibold text-slate-800 dark:text-slate-200'>
                  {item.name}
                </p>
                <p className='text-xs text-slate-400'>
                  {item.daily_rate > 0
                    ? `$${item.daily_rate.toLocaleString('es-MX')}/día`
                    : 'Sin tarifa'}
                </p>
              </div>
              {/* Qty stepper */}
              <div className='flex shrink-0 items-center gap-1'>
                <button
                  type='button'
                  onClick={() => updateQty(item.equipmentId, item.quantity - 1)}
                  disabled={disabled || item.quantity <= 1}
                  className='flex size-6 items-center justify-center rounded border border-slate-300 text-slate-500 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-600'
                >
                  <span className='material-symbols-outlined text-[14px] font-normal'>
                    remove
                  </span>
                </button>
                <span className='w-7 text-center text-sm font-bold text-slate-800 tabular-nums dark:text-white'>
                  {item.quantity}
                </span>
                <button
                  type='button'
                  onClick={() => updateQty(item.equipmentId, item.quantity + 1)}
                  disabled={disabled}
                  className='flex size-6 items-center justify-center rounded border border-slate-300 text-slate-500 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-600'
                >
                  <span className='material-symbols-outlined text-[14px] font-normal'>
                    add
                  </span>
                </button>
              </div>
              {/* Remove */}
              <button
                type='button'
                onClick={() => removeItem(item.equipmentId)}
                disabled={disabled}
                className='mr-3 shrink-0 rounded p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-40'
              >
                <span className='material-symbols-outlined text-[16px] font-normal'>
                  delete
                </span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ══ CART PANEL OVERLAY ══════════════════════════════════════════════ */}
      {isOpen && (
        <div
          className='fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/60 backdrop-blur-sm sm:items-center'
          onClick={(e) => e.target === e.currentTarget && setIsOpen(false)}
        >
          <div className='flex h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-2xl dark:border-slate-700 dark:bg-slate-800'>
            {/* Panel header */}
            <div className='flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700'>
              <div className='flex items-center gap-3'>
                <div className='flex size-9 items-center justify-center rounded-xl bg-[#2d3748] text-white'>
                  <span className='material-symbols-outlined text-[18px] font-normal'>
                    shopping_cart
                  </span>
                </div>
                <div>
                  <h3 className='text-base font-bold text-slate-900 dark:text-white'>
                    Catálogo de Equipo
                  </h3>
                  <p className='text-xs text-slate-500'>
                    {selectedIds.size} artículo(s) seleccionado(s)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className='rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              >
                <span className='material-symbols-outlined text-[20px] font-normal'>
                  close
                </span>
              </button>
            </div>

            {/* Search + type filters */}
            <div className='shrink-0 space-y-3 border-b border-slate-100 px-6 py-4 dark:border-slate-700'>
              <div className='relative'>
                <span className='material-symbols-outlined pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[16px] font-normal text-slate-400'>
                  search
                </span>
                <input
                  type='text'
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder='Buscar por nombre…'
                  className='block w-full rounded-lg border border-slate-300 py-2 pr-3 pl-9 text-sm text-slate-900 placeholder-slate-400 focus:border-[#2d3748] focus:ring-1 focus:ring-[#2d3748] focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-500'
                />
              </div>
              {/* Type filter chips */}
              <div className='flex flex-wrap gap-2'>
                <button
                  onClick={() => setActiveType(null)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${!activeType ? 'bg-[#2d3748] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300'}`}
                >
                  Todos
                </button>
                {presentTypes.map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveType(activeType === t ? null : t)}
                    className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${activeType === t ? 'bg-[#2d3748] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300'}`}
                  >
                    <span className='material-symbols-outlined text-[11px] font-normal'>
                      {TYPE_ICONS[t] ?? 'category'}
                    </span>
                    {TYPE_LABELS[t] ?? t}
                  </button>
                ))}
              </div>
            </div>

            {/* Equipment grid */}
            <div className='custom-scrollbar flex-1 overflow-y-auto p-6'>
              {filtered.length === 0 ? (
                <div className='flex flex-col items-center justify-center gap-2 py-16 text-slate-400'>
                  <span className='material-symbols-outlined text-[40px] font-normal'>
                    search_off
                  </span>
                  <p className='text-sm font-medium'>Sin resultados</p>
                </div>
              ) : (
                <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
                  {filtered.map((equip) => {
                    const inCart = selectedIds.has(equip.id)
                    return (
                      <button
                        key={equip.id}
                        type='button'
                        onClick={() =>
                          inCart ? removeItem(equip.id) : addItem(equip)
                        }
                        className={[
                          'group relative flex flex-col overflow-hidden rounded-xl border text-left transition-all',
                          inCart
                            ? 'border-[#2d3748]/60 bg-[#2d3748]/5 ring-1 ring-[#2d3748]/30 dark:border-slate-500'
                            : 'border-slate-200 bg-white hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800/60',
                        ].join(' ')}
                      >
                        {/* Image */}
                        {equip.image_url ? (
                          <img
                            src={equip.image_url}
                            alt={equip.name}
                            className='h-28 w-full object-cover'
                          />
                        ) : (
                          <div className='flex h-28 w-full items-center justify-center bg-slate-100 dark:bg-slate-700'>
                            <span className='material-symbols-outlined text-[36px] font-normal text-slate-300'>
                              {TYPE_ICONS[equip.type] ?? 'videocam'}
                            </span>
                          </div>
                        )}
                        {/* Info */}
                        <div className='p-3'>
                          <p className='text-sm leading-tight font-semibold text-slate-800 dark:text-slate-200'>
                            {equip.name}
                          </p>
                          {equip.daily_rate > 0 && (
                            <p className='mt-0.5 text-xs font-medium text-slate-400'>
                              ${equip.daily_rate.toLocaleString('es-MX')}/día
                            </p>
                          )}
                          <span className='mt-1 inline-flex items-center gap-0.5 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 uppercase dark:bg-slate-700 dark:text-slate-400'>
                            <span className='material-symbols-outlined text-[10px] font-normal'>
                              {TYPE_ICONS[equip.type] ?? 'category'}
                            </span>
                            {TYPE_LABELS[equip.type] ?? equip.type}
                          </span>
                        </div>
                        {/* Cart badge overlay */}
                        {inCart && (
                          <div className='absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-[#2d3748] text-white shadow'>
                            <span className='material-symbols-outlined text-[14px] font-normal'>
                              check
                            </span>
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer CTA */}
            <div className='flex shrink-0 items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-700 dark:bg-slate-900/60'>
              <p className='text-sm text-slate-500 dark:text-slate-400'>
                {selectedIds.size > 0
                  ? `${selectedIds.size} artículo(s) en el carrito`
                  : 'Haz clic en un artículo para agregarlo'}
              </p>
              <button
                type='button'
                onClick={() => setIsOpen(false)}
                className='flex items-center gap-2 rounded-lg bg-[#2d3748] px-5 py-2.5 text-sm font-bold text-white shadow transition-colors hover:bg-[#1a202c]'
              >
                <span className='material-symbols-outlined text-[16px] font-normal'>
                  check_circle
                </span>
                Confirmar Selección
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
