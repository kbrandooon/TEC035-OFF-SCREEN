import type { LeadStatus } from '../types'

interface StatusBadgeProps {
  status: LeadStatus
}

const statusStyles: Record<LeadStatus, { label: string; classes: string }> = {
  nuevo:      { label: 'Nuevo',      classes: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800' },
  calificado: { label: 'Calificado', classes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
  cotizado:   { label: 'Cotizado',   classes: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800' },
  aceptado:   { label: 'Aceptado',   classes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
  reservado:  { label: 'Reservado',  classes: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800' },
  completado: { label: 'Completado', classes: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800' },
  perdido:    { label: 'Perdido',    classes: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400 border-slate-200 dark:border-slate-800' },
  cancelado:  { label: 'Cancelado',  classes: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800' },
}

/**
 * Renders a stylized badge for lead status.
 */
export function LeadStatusBadge({ status }: StatusBadgeProps) {
  const config = statusStyles[status] || statusStyles.nuevo
  
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${config.classes}`}>
      {config.label}
    </span>
  )
}
