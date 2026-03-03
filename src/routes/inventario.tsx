import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useAuth } from '@/features/auth'
import { useEquipment } from '@/features/equipo'
import {
  InventoryCreateModal,
  InventoryDetailModal,
  InventoryList,
  useInventory,
  type InventoryFormValues,
  type InventoryMovement,
  type MovementType,
} from '@/features/inventario'

export const Route = createFileRoute('/inventario')({
  component: InventarioPage,
})

const EMPTY_FORM: InventoryFormValues = {
  equipment_id: '',
  date: new Date().toISOString().slice(0, 10),
  movement_type: 'in',
  quantity: 1,
  clasification: '',
  description: '',
}

const TYPE_OPTIONS: {
  value: MovementType | ''
  label: string
  icon: string
  color: string
}[] = [
  { value: '', label: 'Todos', icon: 'list', color: 'text-slate-500' },
  {
    value: 'in',
    label: 'Entrada',
    icon: 'arrow_downward',
    color: 'text-emerald-600',
  },
  {
    value: 'out',
    label: 'Salida',
    icon: 'arrow_upward',
    color: 'text-red-600',
  },
  {
    value: 'adjustment',
    label: 'Ajuste',
    icon: 'tune',
    color: 'text-amber-600',
  },
]

/**
 * Inventory movements page under /inventario.
 * Full server-side filtering (date range, type, classification) + pagination.
 */
function InventarioPage() {
  const navigate = useNavigate()
  const { user, isLoading: isAuthLoading } = useAuth()

  // ── Filters ────────────────────────────────────────────────────────────────
  const [page, setPage] = useState(1)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [movementType, setMovementType] = useState<MovementType | ''>('')

  // Reset page when any filter changes
  const applyFilter =
    <T,>(setter: (v: T) => void) =>
    (v: T) => {
      setter(v)
      setPage(1)
    }

  const { inventory, total, totalPages, isLoading, error, refetch, onCreate } =
    useInventory({
      page,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      movementType: movementType || undefined,
    })
  const { equipment } = useEquipment({ page: 1 })

  // ── Modals ─────────────────────────────────────────────────────────────────
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState<InventoryFormValues>(EMPTY_FORM)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [selectedMovement, setSelectedMovement] =
    useState<InventoryMovement | null>(null)

  if (!isAuthLoading && !user) {
    void navigate({ to: '/' })
    return null
  }

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, date: new Date().toISOString().slice(0, 10) })
    setSaveError(null)
    setShowCreate(true)
  }

  const handleSave = async () => {
    if (!form.equipment_id) {
      setSaveError('Selecciona un equipo.')
      return
    }
    setIsSaving(true)
    setSaveError(null)
    try {
      await onCreate(form)
      setShowCreate(false)
      setPage(1)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error al guardar.')
    } finally {
      setIsSaving(false)
    }
  }

  const hasFilters = dateFrom || dateTo || movementType
  const clearFilters = () => {
    setDateFrom('')
    setDateTo('')
    setMovementType('')
    setPage(1)
  }

  const equipmentOptions = equipment.map((eq) => ({ id: eq.id, name: eq.name }))

  const inputClass =
    'block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-slate-400 focus:ring-1 focus:ring-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white'

  return (
    <DashboardLayout>
      {/* ── Header ── */}
      <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
        <div>
          <h3 className='text-2xl font-bold tracking-tight text-slate-800 dark:text-white'>
            Inventario
          </h3>
          <p className='mt-1 text-sm text-slate-500 dark:text-slate-400'>
            Registro de movimientos de stock por equipo.
          </p>
        </div>
        <button
          onClick={openCreate}
          className='bg-primary hover:bg-primary-hover flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white shadow transition-all hover:shadow-md active:scale-[0.98]'
        >
          <span className='material-symbols-outlined text-[18px] font-normal'>
            add
          </span>
          Nuevo Movimiento
        </button>
      </div>

      {/* ── Filter bar ── */}
      <div className='rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800'>
        <div className='flex flex-wrap items-end gap-4'>
          {/* Date from */}
          <div className='flex min-w-[140px] flex-1 flex-col gap-1'>
            <label className='text-xs font-semibold tracking-wider text-slate-500 uppercase'>
              Desde
            </label>
            <div className='relative'>
              <span className='material-symbols-outlined pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-[16px] font-normal text-slate-400'>
                calendar_today
              </span>
              <input
                type='date'
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(e) => applyFilter(setDateFrom)(e.target.value)}
                className={inputClass + ' pl-9'}
              />
            </div>
          </div>

          {/* Date to */}
          <div className='flex min-w-[140px] flex-1 flex-col gap-1'>
            <label className='text-xs font-semibold tracking-wider text-slate-500 uppercase'>
              Hasta
            </label>
            <div className='relative'>
              <span className='material-symbols-outlined pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-[16px] font-normal text-slate-400'>
                event
              </span>
              <input
                type='date'
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(e) => applyFilter(setDateTo)(e.target.value)}
                className={inputClass + ' pl-9'}
              />
            </div>
          </div>

          {/* Clear button */}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className='flex items-center gap-1.5 self-end rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700/50'
            >
              <span className='material-symbols-outlined text-[16px] font-normal'>
                close
              </span>
              Limpiar
            </button>
          )}
        </div>

        {/* Movement type chips */}
        <div className='mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3 dark:border-slate-700'>
          {TYPE_OPTIONS.map((opt) => {
            const active = movementType === opt.value
            return (
              <button
                key={opt.value}
                onClick={() =>
                  applyFilter(setMovementType)(opt.value as MovementType | '')
                }
                className={[
                  'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all',
                  active
                    ? 'border-slate-900 bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
                ].join(' ')}
              >
                <span
                  className={`material-symbols-outlined text-[13px] font-normal ${active ? '' : opt.color}`}
                >
                  {opt.icon}
                </span>
                {opt.label}
              </button>
            )
          })}

          {/* Total count badge — stable on the right */}
          <span className='ml-auto self-center text-sm font-medium text-slate-400 dark:text-slate-500'>
            {total} resultado{total !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* ── List ── */}
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
        <InventoryList inventory={inventory} onSelect={setSelectedMovement} />
      )}

      {/* ── Pagination ── */}
      {!isLoading && !error && totalPages > 1 && (
        <div className='flex items-center justify-between'>
          <p className='text-sm text-slate-500 dark:text-slate-400'>
            Página {page} de {totalPages}
          </p>
          <div className='flex items-center gap-1'>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className='flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
            >
              <span className='material-symbols-outlined text-[18px] font-normal'>
                chevron_left
              </span>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
              )
              .reduce<(number | '…')[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('…')
                acc.push(p)
                return acc
              }, [])
              .map((item, idx) =>
                item === '…' ? (
                  <span key={`ellipsis-${idx}`} className='px-1 text-slate-400'>
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    onClick={() => setPage(item as number)}
                    className={[
                      'flex size-9 items-center justify-center rounded-lg text-sm font-semibold transition-colors',
                      page === item
                        ? 'bg-primary text-white shadow'
                        : 'border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800',
                    ].join(' ')}
                  >
                    {item}
                  </button>
                )
              )}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className='flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
            >
              <span className='material-symbols-outlined text-[18px] font-normal'>
                chevron_right
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {showCreate && (
        <InventoryCreateModal
          equipmentOptions={equipmentOptions}
          form={form}
          onChange={setForm}
          onClose={() => setShowCreate(false)}
          onSave={() => void handleSave()}
          isSaving={isSaving}
          error={saveError}
        />
      )}

      {selectedMovement && (
        <InventoryDetailModal
          movement={selectedMovement}
          equipmentOptions={equipmentOptions}
          onClose={() => setSelectedMovement(null)}
          onDeleted={() => {
            setSelectedMovement(null)
            void refetch()
          }}
          onUpdated={(updated) => {
            setSelectedMovement(updated)
            void refetch()
          }}
        />
      )}
    </DashboardLayout>
  )
}
