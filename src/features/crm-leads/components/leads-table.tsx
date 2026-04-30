import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getLeads } from '../api/get-leads'
import { formatLocalDate } from '@/utils/date-utils'
import { LeadStatusBadge } from './lead-status-badge'
import { LeadSourceBadge } from './lead-source-badge'
import { LeadDetailDrawer } from './lead-detail-drawer'
import type { Lead, LeadStatus } from '../types'

interface LeadsTableProps {
  tenantId: string
}

/**
 * Main Leads Pipeline view for tenant administrators.
 * Shows a list of incoming leads with qualification data and source tracking.
 */
export function LeadsTable({ tenantId }: LeadsTableProps) {
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  const { data: leads = [], isLoading, error } = useQuery({
    queryKey: ['crm-leads', tenantId, statusFilter, search],
    queryFn: () => getLeads(tenantId, {
      status: statusFilter === 'all' ? undefined : statusFilter,
      search: search || undefined
    }),
    enabled: !!tenantId,
  })

  const stats = useMemo(() => {
    return {
      total: leads.length,
      paxTotal: leads.reduce((acc, curr) => acc + (curr.pax_count || 0), 0),
      withInvoice: leads.filter(l => l.requires_invoice).length
    }
  }, [leads])

  if (error) {
    return (
      <div className='rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400'>
        Error al cargar los leads: {error instanceof Error ? error.message : 'Error desconocido'}
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      {/* Filters & Stats Header */}
      <div className='flex flex-wrap items-end justify-between gap-4'>
        <div className='flex flex-wrap items-center gap-3'>
          <div className='relative'>
            <span className='material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400'>search</span>
            <input
              type='text'
              placeholder='Buscar por nombre, empresa...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='h-10 w-64 rounded-xl border border-slate-200 pl-10 pr-4 text-sm focus:border-slate-900 focus:ring-1 focus:ring-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:focus:border-slate-100'
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value as LeadStatus | 'all')}
            className='h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm focus:border-slate-900 focus:ring-1 focus:ring-slate-900 dark:border-slate-800 dark:bg-slate-900'
          >
            <option value='all'>Todos los estatus</option>
            <option value='nuevo'>Nuevos</option>
            <option value='cotizado'>Cotizados</option>
            <option value='aceptado'>Aceptados</option>
            <option value='perdido'>Perdidos</option>
            <option value='cancelado'>Cancelados</option>
          </select>
        </div>

        <div className='flex items-center gap-6 rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/50'>
          <div>
            <p className='text-xs font-medium text-slate-500 uppercase tracking-wider'>Leads</p>
            <p className='text-xl font-bold text-slate-900 dark:text-white'>{stats.total}</p>
          </div>
          <div className='h-8 w-px bg-slate-200 dark:bg-slate-800' />
          <div>
            <p className='text-xs font-medium text-slate-500 uppercase tracking-wider'>Pax Total</p>
            <p className='text-xl font-bold text-slate-900 dark:text-white'>{stats.paxTotal}</p>
          </div>
          <div className='h-8 w-px bg-slate-200 dark:bg-slate-800' />
          <div>
            <p className='text-xs font-medium text-slate-500 uppercase tracking-wider'>Facturas</p>
            <p className='text-xl font-bold text-slate-900 dark:text-white'>{stats.withInvoice}</p>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className='overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950'>
        <div className='overflow-x-auto'>
          <table className='w-full text-left text-sm'>
            <thead>
              <tr className='border-b border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/20'>
                <th className='px-6 py-4 font-semibold text-slate-900 dark:text-slate-100'>Contacto</th>
                <th className='px-6 py-4 font-semibold text-slate-900 dark:text-slate-100'>Solicitud</th>
                <th className='px-6 py-4 font-semibold text-slate-900 dark:text-slate-100'>Personas</th>
                <th className='px-6 py-4 font-semibold text-slate-900 dark:text-slate-100'>Fuente</th>
                <th className='px-6 py-4 font-semibold text-slate-900 dark:text-slate-100'>Estatus</th>
                <th className='px-6 py-4 font-semibold text-slate-900 dark:text-slate-100'>Fecha</th>
                <th className='px-6 py-4 font-semibold text-slate-900 dark:text-slate-100'></th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-100 dark:divide-slate-800'>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className='animate-pulse'>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className='px-6 py-4'>
                        <div className='h-4 rounded bg-slate-100 dark:bg-slate-800' />
                      </td>
                    ))}
                  </tr>
                ))
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={7} className='px-6 py-12 text-center text-slate-500'>
                    No se encontraron leads.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr 
                    key={lead.id} 
                    className='group cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-900/20'
                    onClick={() => setSelectedLead(lead)}
                  >
                    <td className='px-6 py-4'>
                      <div>
                        <p className='font-medium text-slate-900 dark:text-slate-100'>{lead.contact_name}</p>
                        <p className='text-xs text-slate-500'>{lead.company_name || lead.contact_email || lead.contact_phone}</p>
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      <div className='flex items-center gap-2'>
                        <span className={`material-symbols-outlined text-[18px] ${lead.rental_kind === 'estudio' ? 'text-blue-500' : 'text-amber-500'}`}>
                          {lead.rental_kind === 'estudio' ? 'photo_camera' : 'inventory_2'}
                        </span>
                        <span className='capitalize'>{lead.rental_kind}</span>
                        {lead.requires_invoice && (
                          <span className='material-symbols-outlined text-[16px] text-emerald-500' title='Requiere factura'>description</span>
                        )}
                      </div>
                    </td>
                    <td className='px-6 py-4 font-medium'>{lead.pax_count} pax</td>
                    <td className='px-6 py-4'>
                      <LeadSourceBadge source={lead.source} />
                    </td>
                    <td className='px-6 py-4'>
                      <LeadStatusBadge status={lead.status} />
                    </td>
                    <td className='px-6 py-4 text-xs text-slate-500'>
                      {formatLocalDate(lead.created_at, "dd MMM, HH:mm 'hrs'")}
                    </td>
                    <td className='px-6 py-4 text-right'>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedLead(lead)
                        }}
                        className='invisible rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900 group-hover:visible dark:hover:bg-slate-800 dark:hover:text-slate-100'
                      >
                        <span className='material-symbols-outlined'>arrow_forward</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <LeadDetailDrawer 
        lead={selectedLead} 
        onClose={() => setSelectedLead(null)} 
      />
    </div>
  )
}
