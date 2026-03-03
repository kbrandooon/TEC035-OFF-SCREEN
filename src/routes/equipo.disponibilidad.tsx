import { createFileRoute } from '@tanstack/react-router'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useAuth } from '@/features/auth'
import {
  EquipmentAvailabilityFilters,
  EquipmentAvailabilityTable,
  useEquipmentAvailability,
} from '@/features/equipo-disponibilidad'

export const Route = createFileRoute('/equipo/disponibilidad')({
  component: EquipoDisponibilidadPage,
})

/**
 * Equipment Availability page — dedicated route under /equipo/disponibilidad.
 * Shows the multi-select filters (category + name) and the utilization table.
 */
function EquipoDisponibilidadPage() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const availability = useEquipmentAvailability()

  if (!isAuthLoading && !user) return null

  return (
    <DashboardLayout>
      {/* Page header */}
      <div>
        <h3 className='text-2xl font-bold tracking-tight text-slate-800 dark:text-white'>
          Disponibilidad de Equipo
        </h3>
        <p className='mt-1 text-sm text-slate-500 dark:text-slate-400'>
          Consulta en tiempo real qué equipo está disponible para un rango de
          fechas.
        </p>
      </div>

      {/* Filters card */}
      <div className='rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/60'>
        <h4 className='mb-4 text-xs font-bold tracking-widest text-slate-500 uppercase dark:text-slate-400'>
          Parámetros de consulta
        </h4>
        <EquipmentAvailabilityFilters
          start={availability.start}
          onStartChange={availability.setStart}
          end={availability.end}
          onEndChange={availability.setEnd}
          selectedTypes={availability.types}
          onToggleType={availability.toggleType}
          onClearTypes={availability.clearTypes}
          availableTypes={availability.availableTypes}
          selectedNames={availability.selectedNames}
          onToggleName={availability.toggleName}
          onClearNames={availability.clearNames}
          availableNames={availability.availableNames}
          canQuery={availability.canQuery}
          isLoading={availability.isLoading}
        />
      </div>

      {/* Results table */}
      <EquipmentAvailabilityTable
        results={availability.results}
        isLoading={availability.isLoading}
        canQuery={availability.canQuery}
      />
    </DashboardLayout>
  )
}
