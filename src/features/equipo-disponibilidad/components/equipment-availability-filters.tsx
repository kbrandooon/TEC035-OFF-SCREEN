import { useRef, useState } from 'react'
import type { EquipmentType } from '@/features/equipo'

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

const ALL_TYPES: EquipmentType[] = [
  'camara',
  'lente',
  'iluminacion',
  'tramoya',
  'audio',
  'video',
  'estudio',
  'otros_accesorios',
]

interface Props {
  start: string
  onStartChange: (v: string) => void
  end: string
  onEndChange: (v: string) => void
  selectedTypes: string[]
  onToggleType: (t: string) => void
  onClearTypes: () => void
  availableTypes: string[]
  selectedNames: string[]
  onToggleName: (n: string) => void
  onClearNames: () => void
  availableNames: string[]
  canQuery: boolean
  isLoading: boolean
}

// ── Reusable multi-select combobox dropdown ───────────────────────────────────

interface ComboboxProps {
  label: string
  placeholder: string
  icon: string
  selected: string[]
  options: string[]
  fallbackOptions: string[]
  getLabel?: (v: string) => string
  onToggle: (v: string) => void
  onClear: () => void
  disabled: boolean
}

function MultiCombobox({
  label,
  placeholder,
  icon,
  selected,
  options,
  fallbackOptions,
  getLabel,
  onToggle,
  onClear,
  disabled,
}: ComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const displayLabel = (v: string) => (getLabel ? getLabel(v) : v)

  const source = options.length > 0 ? options : fallbackOptions
  const filtered = query.trim()
    ? source.filter((v) =>
        displayLabel(v).toLowerCase().includes(query.toLowerCase())
      )
    : source

  const buttonLabel =
    selected.length === 0
      ? label
      : selected.length === 1
        ? displayLabel(selected[0])
        : `${selected.length} seleccionados`

  return (
    <div className='flex flex-col gap-1'>
      <span className='text-xs font-semibold text-slate-600 dark:text-slate-400'>
        {label}
      </span>
      <div className='relative'>
        <button
          type='button'
          disabled={disabled}
          onClick={() => {
            setOpen((v) => !v)
            setTimeout(() => inputRef.current?.focus(), 50)
          }}
          className={[
            'flex min-w-[200px] items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40',
            selected.length > 0
              ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
              : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
          ].join(' ')}
        >
          <span className='material-symbols-outlined text-[18px] font-normal'>
            {icon}
          </span>
          <span className='flex-1 truncate text-left'>{buttonLabel}</span>
          {selected.length > 0 && (
            <span
              role='button'
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation()
                onClear()
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.stopPropagation()
                  onClear()
                }
              }}
              className='material-symbols-outlined text-[14px] font-normal opacity-70 hover:opacity-100'
            >
              close
            </span>
          )}
          <span className='material-symbols-outlined shrink-0 text-[16px] font-normal'>
            {open ? 'expand_less' : 'expand_more'}
          </span>
        </button>

        {open && (
          <div className='absolute top-full left-0 z-40 mt-1.5 w-full min-w-[220px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800'>
            {/* Search inside dropdown */}
            <div className='border-b border-slate-100 p-2 dark:border-slate-700'>
              <div className='relative'>
                <span className='material-symbols-outlined pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 text-[16px] font-normal text-slate-400'>
                  search
                </span>
                <input
                  ref={inputRef}
                  type='text'
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={placeholder}
                  className='w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pr-2 pl-7 text-sm text-slate-800 placeholder-slate-400 focus:border-slate-400 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400'
                />
              </div>
            </div>

            {/* Options list */}
            <div className='max-h-56 overflow-y-auto py-1'>
              {filtered.length === 0 ? (
                <p className='px-3 py-4 text-center text-xs text-slate-400'>
                  Sin resultados
                </p>
              ) : (
                filtered.map((v) => {
                  const isSelected = selected.includes(v)
                  return (
                    <button
                      key={v}
                      onClick={() => onToggle(v)}
                      className='flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-700'
                    >
                      <span
                        className={[
                          'flex size-4 shrink-0 items-center justify-center rounded border text-[10px] font-bold transition-colors',
                          isSelected
                            ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'
                            : 'border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800',
                        ].join(' ')}
                      >
                        {isSelected && '✓'}
                      </span>
                      <span
                        className={
                          isSelected
                            ? 'font-semibold text-slate-800 dark:text-white'
                            : 'text-slate-600 dark:text-slate-300'
                        }
                      >
                        {displayLabel(v)}
                      </span>
                    </button>
                  )
                })
              )}
            </div>

            {/* Footer: selected count + clear */}
            {selected.length > 0 && (
              <div className='flex items-center justify-between border-t border-slate-100 px-3 py-2 dark:border-slate-700'>
                <span className='text-xs text-slate-400'>
                  {selected.length} seleccionado{selected.length > 1 ? 's' : ''}
                </span>
                <button
                  onClick={() => {
                    onClear()
                    setOpen(false)
                  }}
                  className='text-xs font-semibold text-slate-500 hover:text-red-500 dark:text-slate-400'
                >
                  Limpiar
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main filter component ─────────────────────────────────────────────────────

/**
 * Filters panel for the Equipment Availability view.
 *
 * - Two datetime pickers (required to enable the query)
 * - Multi-select combobox for equipment names (searches as you type)
 * - Multi-select combobox for equipment categories
 * All filters can be used individually or together.
 */
export function EquipmentAvailabilityFilters({
  start,
  onStartChange,
  end,
  onEndChange,
  selectedTypes,
  onToggleType,
  onClearTypes,
  availableTypes,
  selectedNames,
  onToggleName,
  onClearNames,
  availableNames,
  canQuery,
  isLoading,
}: Props) {
  /**
   * Local draft for the end datetime — updates on every keystroke for display
   * but only commits to the parent (triggering the query) on blur.
   * This prevents the RPC from firing while the user is still picking a time.
   */
  const [endDraft, setEndDraft] = useState(end)
  return (
    <div className='flex flex-wrap items-end gap-3'>
      {/* ── Inicio ─────────────────────────────────────────── */}
      <div className='flex min-w-[200px] flex-1 flex-col gap-1'>
        <label
          htmlFor='avail-start'
          className='text-xs font-semibold text-slate-600 dark:text-slate-400'
        >
          Inicio del evento
        </label>
        <input
          id='avail-start'
          type='datetime-local'
          value={start}
          onChange={(e) => onStartChange(e.target.value)}
          disabled={isLoading}
          className='rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-300 focus:outline-none disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
        />
      </div>

      {/* ── Fin del evento — commits on blur ──────────────── */}
      <div className='flex min-w-[200px] flex-1 flex-col gap-1'>
        <label
          htmlFor='avail-end'
          className='text-xs font-semibold text-slate-600 dark:text-slate-400'
        >
          Fin del evento
        </label>
        <input
          id='avail-end'
          type='datetime-local'
          value={endDraft}
          onChange={(e) => setEndDraft(e.target.value)}
          onBlur={() => onEndChange(endDraft)}
          disabled={isLoading}
          className='rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-300 focus:outline-none disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
        />
      </div>

      {/* ── Category multi-select combobox ─────────────────── */}
      <MultiCombobox
        label='Categoría'
        placeholder='Buscar categoría...'
        icon='filter_list'
        selected={selectedTypes}
        options={availableTypes}
        fallbackOptions={ALL_TYPES}
        getLabel={(v) => TYPE_LABELS[v as EquipmentType] ?? v}
        onToggle={onToggleType}
        onClear={onClearTypes}
        disabled={isLoading || !canQuery}
      />

      {/* ── Name multi-select combobox ──────────────────────── */}
      <MultiCombobox
        label='Equipo'
        placeholder='Buscar equipo...'
        icon='videocam'
        selected={selectedNames}
        options={availableNames}
        fallbackOptions={[]}
        onToggle={onToggleName}
        onClear={onClearNames}
        disabled={isLoading || !canQuery}
      />

      {/* ── Status pill ─────────────────────────────────────── */}
      {canQuery && (
        <div className='flex items-center gap-1.5 self-end pb-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400'>
          <span className='material-symbols-outlined text-[14px] font-normal'>
            check_circle
          </span>
          Consultando
        </div>
      )}
    </div>
  )
}
