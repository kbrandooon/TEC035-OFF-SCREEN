import { useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useAuth } from '@/features/auth'
import {
  EquipmentDetailModal,
  EquipmentFormModal,
  EquipmentList,
  useEquipment,
  type Equipment,
  type EquipmentFormValues,
  type EquipmentStatus,
  type EquipmentType,
} from '@/features/equipo'

export const Route = createFileRoute('/equipo/')({
  component: EquipoPage,
})

type StatusTab = 'todos' | EquipmentStatus

const STATUS_TABS: {
  value: StatusTab
  label: string
  icon: string
  dotClass: string
}[] = [
  { value: 'todos', label: 'Todos', icon: 'grid_view', dotClass: '' },
  {
    value: 'disponible',
    label: 'Disponible',
    icon: 'check_circle',
    dotClass: 'text-emerald-500',
  },
  {
    value: 'mantenimiento',
    label: 'Mantenimiento',
    icon: 'schedule',
    dotClass: 'text-amber-500',
  },
  {
    value: 'no_disponible',
    label: 'No Disponible',
    icon: 'cancel',
    dotClass: 'text-red-500',
  },
]

const TYPE_OPTIONS: { value: EquipmentType | null; label: string }[] = [
  { value: null, label: 'Todos los tipos' },
  { value: 'camara', label: 'Cámara' },
  { value: 'lente', label: 'Lente' },
  { value: 'iluminacion', label: 'Iluminación' },
  { value: 'tramoya', label: 'Tramoya' },
  { value: 'audio', label: 'Audio' },
  { value: 'video', label: 'Video' },
  { value: 'estudio', label: 'Estudio' },
  { value: 'otros_accesorios', label: 'Otros Accesorios' },
]

/**
 * Equipment Stock page (/equipo) — server-side paginated list with text search,
 * type filter, and status tabs. Clicking a card opens the detail modal overlay.
 */
function EquipoPage() {
  const { user, isLoading: isAuthLoading } = useAuth()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusTab>('todos')
  const [typeFilter, setTypeFilter] = useState<EquipmentType | null>(null)
  const [showTypeMenu, setShowTypeMenu] = useState(false)
  const [page, setPage] = useState(1)
  const typeMenuRef = useRef<HTMLDivElement>(null)

  const {
    equipment,
    total,
    pageSize,
    totalPages,
    isLoading,
    error,
    onCreate,
    refetch,
  } = useEquipment({
    page,
    search,
    status: statusFilter === 'todos' ? null : statusFilter,
    type: typeFilter,
  })

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<Equipment | null>(null)

  if (!isAuthLoading && !user) return null

  const changeStatus = (tab: StatusTab) => {
    setStatusFilter(tab)
    setPage(1)
  }
  const changeSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }
  const changeType = (t: EquipmentType | null) => {
    setTypeFilter(t)
    setPage(1)
    setShowTypeMenu(false)
  }

  const handleCreate = async (values: EquipmentFormValues) => {
    setIsSaving(true)
    setSaveError(null)
    try {
      await onCreate(values)
      setIsCreateOpen(false)
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : 'Error al crear el equipo.'
      )
    } finally {
      setIsSaving(false)
    }
  }

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  const activeTypeLabel =
    TYPE_OPTIONS.find((o) => o.value === typeFilter)?.label ?? 'Tipo'

  return (
    <DashboardLayout>
      <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
        <div>
          <h3 className='text-2xl font-bold tracking-tight text-slate-800 dark:text-white'>
            Stock de Equipo
          </h3>
          <p className='mt-1 text-sm text-slate-500 dark:text-slate-400'>
            Gestiona el inventario de equipo de tu estudio.
          </p>
        </div>
        <button
          onClick={() => {
            setSaveError(null)
            setIsCreateOpen(true)
          }}
          className='bg-primary hover:bg-primary-hover flex items-center gap-2 rounded-lg border border-transparent px-5 py-2.5 font-medium text-white shadow transition-all hover:shadow-md active:scale-[0.98]'
        >
          <span className='material-symbols-outlined text-[20px] font-normal'>
            add
          </span>
          Nuevo Equipo
        </button>
      </div>

      {/* ── Filter bar ─────────────────────────────────────── */}
      <div className='flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-slate-700 dark:bg-slate-800'>
        {/* Text search */}
        <div className='relative flex-1'>
          <span className='material-symbols-outlined absolute top-1/2 left-2.5 -translate-y-1/2 text-[18px] font-normal text-slate-400'>
            search
          </span>
          <input
            id='equipment-search'
            type='text'
            value={search}
            onChange={(e) => changeSearch(e.target.value)}
            placeholder='Buscar por nombre o descripción...'
            className='w-full rounded-lg border border-transparent bg-transparent py-1.5 pr-7 pl-8 text-sm text-slate-800 placeholder-slate-400 focus:border-slate-300 focus:ring-1 focus:ring-slate-300 focus:outline-none dark:text-white dark:placeholder-slate-500'
          />
          {search && (
            <button
              onClick={() => changeSearch('')}
              className='absolute top-1/2 right-2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white'
            >
              <span className='material-symbols-outlined text-[16px] font-normal'>
                close
              </span>
            </button>
          )}
        </div>

        {/* Divider */}
        <div className='h-5 w-px shrink-0 bg-slate-200 dark:bg-slate-600' />

        {/* Type filter icon button + dropdown */}
        <div className='relative shrink-0' ref={typeMenuRef}>
          <button
            onClick={() => setShowTypeMenu((v) => !v)}
            title='Filtrar por tipo'
            className={[
              'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold transition-all',
              typeFilter
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700',
            ].join(' ')}
          >
            <span className='material-symbols-outlined text-[18px] font-normal'>
              filter_list
            </span>
            <span className='hidden sm:inline'>
              {typeFilter ? activeTypeLabel : 'Tipo'}
            </span>
            {typeFilter && (
              <span
                role='button'
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation()
                  changeType(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.stopPropagation()
                    changeType(null)
                  }
                }}
                className='material-symbols-outlined text-[14px] font-normal opacity-70 hover:opacity-100'
              >
                close
              </span>
            )}
          </button>

          {/* Dropdown */}
          {showTypeMenu && (
            <div className='absolute top-full left-0 z-30 mt-1.5 min-w-[180px] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-slate-800'>
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={String(opt.value)}
                  onClick={() => changeType(opt.value)}
                  className={[
                    'flex w-full items-center px-3 py-2 text-left text-sm transition-colors',
                    typeFilter === opt.value
                      ? 'bg-slate-900 font-semibold text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700',
                  ].join(' ')}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className='h-5 w-px shrink-0 bg-slate-200 dark:bg-slate-600' />

        {/* Status tabs */}
        <div className='flex items-center gap-0.5 overflow-x-auto'>
          {STATUS_TABS.map((tab) => {
            const isActive = statusFilter === tab.value
            return (
              <button
                key={tab.value}
                onClick={() => changeStatus(tab.value)}
                className={[
                  'flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold transition-all',
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-900'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700',
                ].join(' ')}
              >
                <span
                  className={[
                    'material-symbols-outlined text-[16px] font-normal',
                    isActive ? '' : tab.dotClass,
                  ].join(' ')}
                >
                  {tab.icon}
                </span>
                <span className='hidden sm:inline'>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Divider */}
        <div className='h-5 w-px shrink-0 bg-slate-200 dark:bg-slate-600' />

        {/* Article count — always fixed width so rest of bar never shifts */}
        <span className='w-20 shrink-0 text-right text-xs font-bold text-slate-500 dark:text-slate-400'>
          {isLoading
            ? '...'
            : `${total} ${total === 1 ? 'artículo' : 'artículos'}`}
        </span>
      </div>

      {/* ── Content ────────────────────────────────────────── */}
      {isLoading ? (
        <div className='flex h-64 items-center justify-center'>
          <span className='material-symbols-outlined animate-spin text-[36px] font-normal text-slate-400'>
            progress_activity
          </span>
        </div>
      ) : error ? (
        <div className='rounded-lg border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-600 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400'>
          {error}
        </div>
      ) : (
        <EquipmentList equipment={equipment} onSelect={setSelectedItem} />
      )}

      {/* ── Pagination ─────────────────────────────────────── */}
      {!isLoading && totalPages > 1 && (
        <div className='flex flex-col items-center justify-between gap-3 sm:flex-row'>
          <p className='text-sm text-slate-500 dark:text-slate-400'>
            Mostrando{' '}
            <span className='font-semibold text-slate-700 dark:text-white'>
              {from}–{to}
            </span>{' '}
            de{' '}
            <span className='font-semibold text-slate-700 dark:text-white'>
              {total}
            </span>{' '}
            artículos
          </p>
          <div className='flex items-center gap-1'>
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
              className='flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700'
            >
              <span className='material-symbols-outlined text-[20px] font-normal'>
                chevron_left
              </span>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
              )
              .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1)
                  acc.push('ellipsis')
                acc.push(p)
                return acc
              }, [])
              .map((item, idx) =>
                item === 'ellipsis' ? (
                  <span
                    key={`e-${idx}`}
                    className='flex size-9 items-center justify-center text-sm text-slate-400'
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    onClick={() => setPage(item)}
                    className={[
                      'flex size-9 items-center justify-center rounded-lg border text-sm font-semibold transition-all',
                      page === item
                        ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
                    ].join(' ')}
                  >
                    {item}
                  </button>
                )
              )}
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page === totalPages}
              className='flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700'
            >
              <span className='material-symbols-outlined text-[20px] font-normal'>
                chevron_right
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ── Create modal ───────────────────────────────────── */}
      <EquipmentFormModal
        equipment={null}
        isOpen={isCreateOpen}
        isSaving={isSaving}
        error={saveError}
        onClose={() => setIsCreateOpen(false)}
        onSave={async (values) => {
          await handleCreate(values)
        }}
      />

      {/* ── Detail overlay ─────────────────────────────────── */}
      {selectedItem && (
        <EquipmentDetailModal
          equipment={selectedItem}
          onClose={() => setSelectedItem(null)}
          onDeleted={() => {
            setSelectedItem(null)
            void refetch()
          }}
          onUpdated={(updated) => {
            setSelectedItem(updated)
            void refetch()
          }}
        />
      )}
    </DashboardLayout>
  )
}
