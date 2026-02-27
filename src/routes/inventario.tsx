import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useAuth } from '@/features/auth'
import { InventoryList, useInventory } from '@/features/inventario'
import type { InventoryFormValues } from '@/features/inventario'
import { useEquipment } from '@/features/equipo'

export const Route = createFileRoute('/inventario')({
  component: InventarioPage,
})

const MOVEMENT_LABELS = { in: 'Entrada', out: 'Salida', adjustment: 'Ajuste' }

/**
 * Inventory movements page under /inventario.
 * Shows the full movement log and allows registering new entries.
 */
function InventarioPage() {
  const navigate = useNavigate()
  const { user, isLoading: isAuthLoading } = useAuth()
  const { inventory, isLoading, error, refetch, onCreate } = useInventory()
  const { equipment } = useEquipment()

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<InventoryFormValues>({
    equipment_id: '',
    date: new Date().toISOString().slice(0, 10),
    movement_type: 'in',
    quantity: 1,
    clasification: '',
    description: '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  if (!isAuthLoading && !user) {
    void navigate({ to: '/' })
    return null
  }

  const handleSave = async () => {
    if (!form.equipment_id) { setSaveError('Selecciona un equipo.'); return }
    setIsSaving(true)
    setSaveError(null)
    try {
      await onCreate(form)
      setShowForm(false)
      setForm({ equipment_id: '', date: new Date().toISOString().slice(0, 10), movement_type: 'in', quantity: 1, clasification: '', description: '' })
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error al guardar.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
        <div>
          <h3 className='text-2xl font-bold tracking-tight text-slate-800 dark:text-white'>Inventario</h3>
          <p className='mt-1 text-sm text-slate-500 dark:text-slate-400'>Registro de movimientos de stock por equipo.</p>
        </div>
        <div className='flex gap-2'>
          <button onClick={() => void refetch()} className='flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition-all hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'>
            <span className='material-symbols-outlined text-[18px] font-normal'>refresh</span>
            Actualizar
          </button>
          <button onClick={() => setShowForm((v) => !v)} className='bg-primary hover:bg-primary-hover flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white shadow transition-all hover:shadow-md active:scale-[0.98]'>
            <span className='material-symbols-outlined text-[18px] font-normal'>{showForm ? 'close' : 'add'}</span>
            {showForm ? 'Cancelar' : 'Nuevo Movimiento'}
          </button>
        </div>
      </div>

      {/* Inline form */}
      {showForm && (
        <div className='rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800'>
          <h4 className='mb-4 text-base font-bold text-slate-800 dark:text-white'>Registrar Movimiento</h4>
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            <div>
              <label className='mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200'>Equipo *</label>
              <select value={form.equipment_id} onChange={(e) => setForm((f) => ({ ...f, equipment_id: e.target.value }))}
                className='block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white'>
                <option value=''>Selecciona equipo...</option>
                {equipment.map((eq) => <option key={eq.id} value={eq.id}>{eq.name}</option>)}
              </select>
            </div>
            <div>
              <label className='mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200'>Tipo *</label>
              <select value={form.movement_type} onChange={(e) => setForm((f) => ({ ...f, movement_type: e.target.value as InventoryFormValues['movement_type'] }))}
                className='block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white'>
                {(Object.entries(MOVEMENT_LABELS) as [InventoryFormValues['movement_type'], string][]).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className='mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200'>Cantidad *</label>
              <input type='number' min={1} value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: Number(e.target.value) }))}
                className='block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white' />
            </div>
            <div>
              <label className='mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200'>Fecha *</label>
              <input type='date' value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className='block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white' />
            </div>
            <div>
              <label className='mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200'>Clasificación</label>
              <input type='text' value={form.clasification} onChange={(e) => setForm((f) => ({ ...f, clasification: e.target.value }))} placeholder='Ej. Compra, Préstamo...'
                className='block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm placeholder-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white' />
            </div>
            <div>
              <label className='mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200'>Descripción</label>
              <input type='text' value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder='Notas adicionales...'
                className='block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm placeholder-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white' />
            </div>
          </div>
          {saveError && <div className='mt-3 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400'>{saveError}</div>}
          <div className='mt-4 flex justify-end'>
            <button onClick={() => void handleSave()} disabled={isSaving}
              className='bg-primary hover:bg-primary-hover rounded-lg px-6 py-2.5 text-sm font-bold text-white disabled:opacity-60'>
              {isSaving ? 'Guardando...' : 'Guardar Movimiento'}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className='flex h-64 items-center justify-center'>
          <span className='material-symbols-outlined animate-spin text-[36px] font-normal text-slate-400'>progress_activity</span>
        </div>
      ) : error ? (
        <div className='rounded-lg border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-600 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400'>{error}</div>
      ) : (
        <InventoryList inventory={inventory} />
      )}
    </DashboardLayout>
  )
}
