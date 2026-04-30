import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { updateLeadStatus } from '../api/update-lead-status'
import { formatLocalDate } from '@/utils/date-utils'
import { LeadSourceBadge } from './lead-source-badge'
import type { Lead, LeadStatus } from '../types'
import { createQuoteFromLead } from '@/features/crm-quotes/utils/quote-converters'
import { QuoteItemsEditor } from '@/features/crm-quotes/components/quote-items-editor'
import type { Quote, QuoteItem } from '@/features/crm-quotes/types/quote.types'
import { useEquipmentByIds } from '@/features/equipo/hooks/use-equipment-by-ids'
import { saveQuote } from '@/features/crm-quotes/api/save-quote'
import { getQuoteByLeadId } from '@/features/crm-quotes/api/get-quote-by-lead-id'
import { openQuoteDocument } from '@/features/crm-quotes/utils/quote-doc-generator'
import { useAuth } from '@/features/auth'
import { acceptQuote } from '@/features/crm-quotes/api/accept-quote'

interface LeadDetailDrawerProps {
  lead: Lead | null
  onClose: () => void
}

/**
 * Detailed view and management panel for a single lead.
 * Allows status transitions and displays all qualification data.
 */
export function LeadDetailDrawer({ lead, onClose }: LeadDetailDrawerProps) {
  const queryClient = useQueryClient()
  const { session } = useAuth()
  const [isUpdating, setIsUpdating] = useState(false)
  const [isQuoteDrawerOpen, setIsQuoteDrawerOpen] = useState(false)
  const [quoteDraft, setQuoteDraft] = useState<Partial<Quote> | null>(null)
  const [localStatus, setLocalStatus] = useState<LeadStatus>(lead?.status ?? 'nuevo')

  const { data: requestedEquipment = [], isLoading: isLoadingEquipment } = useEquipmentByIds(lead?.equipment_ids || [])

  const { data: savedQuote, isLoading: isLoadingQuote } = useQuery({
    queryKey: ['quote-by-lead', lead?.id],
    queryFn: () => getQuoteByLeadId(lead!.id),
    enabled: Boolean(lead?.id),
  })

  const handleOpenPDF = async () => {
    try {
      const quote = await getQuoteByLeadId(lead!.id)
      if (!quote) {
        toast.error('No hay cotización guardada para este lead.')
        return
      }
      openQuoteDocument(quote)
    } catch (err) {
      toast.error('Error al generar el documento: ' + (err instanceof Error ? err.message : 'Intenta de nuevo.'))
    }
  }

  const mutation = useMutation({
    mutationFn: (newStatus: LeadStatus) => updateLeadStatus(lead!.id, newStatus),
    onSuccess: (_, newStatus) => {
      setLocalStatus(newStatus)
      queryClient.invalidateQueries({ queryKey: ['crm-leads'] })
      toast.success('Estatus actualizado correctamente.')
      setIsUpdating(false)
    },
    onError: (error) => {
      toast.error('Error al actualizar: ' + error.message)
      setIsUpdating(false)
    }
  })

  const saveQuoteMutation = useMutation({
    mutationFn: saveQuote,
    onSuccess: () => {
      updateLeadStatus(lead!.id, 'cotizado').then(() => {
        setLocalStatus('cotizado')
        queryClient.invalidateQueries({ queryKey: ['crm-leads'] })
      })
      toast.success('Cotización guardada. Etapa actualizada a Cotizado.')
      setIsQuoteDrawerOpen(false)
      queryClient.invalidateQueries({ queryKey: ['crm-quotes'] })
    },
    onError: (error: Error) => {
      toast.error(`Error al guardar: ${error.message}`)
    }
  })

  const acceptQuoteMutation = useMutation({
    mutationFn: () => acceptQuote(quoteDraft as Quote, lead!.id),
    onSuccess: () => {
      toast.success('¡Cotización Aceptada! Reserva creada en el calendario.')
      setIsQuoteDrawerOpen(false)
      onClose() // Close lead drawer too
      queryClient.invalidateQueries({ queryKey: ['crm-leads', 'bookings'] })
    },
    onError: (error: Error) => {
      toast.error(`Error al procesar: ${error.message}`)
    }
  })

  if (!lead) return null

  const handleStatusChange = (status: LeadStatus) => {
    setIsUpdating(true)
    mutation.mutate(status)
  }

  const formatCurrency = (val: number | null) => {
    if (!val) return '$0.00'
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val)
  }

  return (
    <div className='fixed inset-0 z-[60] flex justify-end overflow-hidden bg-slate-900/40 backdrop-blur-sm'>
      {/* Backdrop for closing */}
      <div className='absolute inset-0' onClick={onClose} />
      
      {/* Panel */}
      <div className='relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-300 dark:bg-slate-950'>
        {/* Header */}
        <div className='flex items-center justify-between border-b border-slate-100 p-6 dark:border-slate-800'>
          <div>
            <h2 className='text-lg font-bold text-slate-900 dark:text-white'>Detalles del Lead</h2>
            <p className='text-xs text-slate-500 uppercase tracking-wider'>ID: {lead.id.slice(0, 8)}</p>
          </div>
          <button onClick={onClose} className='rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-900'>
            <span className='material-symbols-outlined'>close</span>
          </button>
        </div>

        {/* Content */}
        <div className='flex-1 overflow-y-auto p-6 space-y-8'>
          {/* Status Management */}
          <section className='space-y-3'>
            <h3 className='text-sm font-semibold text-slate-900 dark:text-slate-100'>Gestión de Etapa</h3>
            <div className='flex flex-wrap gap-2'>
              {(['nuevo', 'cotizado', 'aceptado', 'perdido', 'cancelado'] as LeadStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  disabled={isUpdating || localStatus === s}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    localStatus === s
                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-900 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400'
                  } disabled:opacity-50`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </section>

          {/* Contact Info */}
          <section className='space-y-4'>
            <div className='flex items-start justify-between'>
              <div>
                <p className='text-sm font-medium text-slate-500 uppercase tracking-wider'>Contacto</p>
                <p className='text-xl font-bold text-slate-900 dark:text-white'>{lead.contact_name}</p>
                {lead.company_name && <p className='text-slate-600 dark:text-slate-400'>{lead.company_name}</p>}
              </div>
              <LeadSourceBadge source={lead.source} />
            </div>
            
            <div className='grid gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/30'>
              <div className='flex items-center gap-3'>
                <span className='material-symbols-outlined text-slate-400'>mail</span>
                <p className='text-sm text-slate-700 dark:text-slate-300'>{lead.contact_email || 'No proporcionado'}</p>
              </div>
              <div className='flex items-center gap-3'>
                <span className='material-symbols-outlined text-slate-400'>call</span>
                <p className='text-sm text-slate-700 dark:text-slate-300 font-medium'>{lead.contact_phone}</p>
              </div>
            </div>
          </section>

          {/* Request Details */}
          <section className='space-y-4'>
            <p className='text-sm font-medium text-slate-500 uppercase tracking-wider'>Solicitud</p>
            <div className='grid grid-cols-2 gap-4'>
              <div className='rounded-xl border border-slate-100 p-3 dark:border-slate-800'>
                <p className='text-xs text-slate-500'>Tipo de Renta</p>
                <p className='font-semibold capitalize text-slate-900 dark:text-white'>{lead.rental_kind}</p>
              </div>
              <div className='rounded-xl border border-slate-100 p-3 dark:border-slate-800'>
                <p className='text-xs text-slate-500'>Personas (Pax)</p>
                <p className='font-semibold text-slate-900 dark:text-white'>{lead.pax_count} personas</p>
              </div>
              <div className='rounded-xl border border-slate-100 p-3 dark:border-slate-800'>
                <p className='text-xs text-slate-500'>Presupuesto</p>
                <p className='font-semibold text-slate-900 dark:text-white'>{formatCurrency(lead.budget)}</p>
              </div>
              <div className='rounded-xl border border-slate-100 p-3 dark:border-slate-800'>
                <p className='text-xs text-slate-500'>Requiere Factura</p>
                <p className={`font-semibold ${lead.requires_invoice ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {lead.requires_invoice ? 'SÍ' : 'NO'}
                </p>
              </div>
            </div>

            <div className='rounded-xl bg-slate-900 p-4 text-white dark:bg-slate-100 dark:text-slate-900 shadow-lg'>
              <p className='mb-3 text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase opacity-70'>
                Ventana de Tiempo Solicitada
              </p>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-1'>
                  <p className='text-[10px] font-medium opacity-60 uppercase tracking-wider'>Inicio</p>
                  <p className='text-base font-light leading-none'>
                    {formatLocalDate(lead.window_start, "dd MMM")}&nbsp;
                    <span className='font-bold'>{formatLocalDate(lead.window_start, "HH:mm")}</span>
                  </p>
                </div>
                <div className='space-y-1 border-l border-white/10 dark:border-slate-300 pl-4'>
                  <p className='text-[10px] font-medium opacity-60 uppercase tracking-wider'>Fin</p>
                  <p className='text-base font-light leading-none'>
                    {formatLocalDate(lead.window_end, "dd MMM")}&nbsp;
                    <span className='font-bold'>{formatLocalDate(lead.window_end, "HH:mm")}</span>
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Notes */}
          <section className='space-y-2'>
            <p className='text-sm font-medium text-slate-500 uppercase tracking-wider'>Notas / Requerimientos</p>
            <div className='rounded-xl border border-slate-100 bg-white p-4 italic text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400'>
              {lead.notes || 'Sin notas adicionales.'}
            </div>
          </section>

          {/* Equipment Snapshot */}
          <section className='space-y-3'>
            <p className='text-sm font-medium text-slate-500 uppercase tracking-wider'>Equipo Solicitado ({lead.equipment_ids?.length || 0})</p>
            
            {isLoadingEquipment ? (
              <div className='flex gap-2 animate-pulse'>
                {[1, 2].map(i => <div key={i} className='h-16 w-full rounded-xl bg-slate-100 dark:bg-slate-800' />)}
              </div>
            ) : requestedEquipment.length > 0 ? (
              <div className='grid grid-cols-1 gap-2'>
                {requestedEquipment.map((item) => (
                  <div key={item.id} className='flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-2 dark:border-slate-800 dark:bg-slate-900'>
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className='size-12 rounded-lg object-cover' />
                    ) : (
                      <div className='flex size-12 items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800'>
                        <span className='material-symbols-outlined text-slate-400'>videocam</span>
                      </div>
                    )}
                    <div className='flex-1 overflow-hidden'>
                      <p className='truncate text-sm font-bold text-slate-900 dark:text-white'>{item.name}</p>
                    </div>
                    <div className='pr-2 text-right'>
                      <p className='text-[10px] font-bold text-slate-400 uppercase'>Cant.</p>
                      <p className='text-sm font-bold'>1</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='rounded-xl border-2 border-dashed border-slate-100 py-6 text-center text-xs text-slate-400 dark:border-slate-800'>
                No hay información de equipos detallada.
              </div>
            )}
          </section>
        </div>

        {/* Actions Footer */}
        <div className='border-t border-slate-100 p-6 space-y-3 dark:border-slate-800'>
          <button
            className='flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 font-bold text-white shadow-lg transition-transform active:scale-95 dark:bg-white dark:text-slate-900'
            onClick={() => {
              const userTenantId = (session?.user?.app_metadata as any)?.tenant_id
              const draft = createQuoteFromLead(lead, requestedEquipment)
              setQuoteDraft({
                ...draft,
                tenantId: userTenantId || lead.tenant_id
              })
              setIsQuoteDrawerOpen(true)
            }}
          >
            <span className='material-symbols-outlined text-[20px]'>description</span>
            Generar Cotización
          </button>

          {!isLoadingQuote && savedQuote && (
            <button
              className='flex w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-900 py-3 font-bold text-slate-900 transition-transform active:scale-95 dark:border-white dark:text-white'
              onClick={handleOpenPDF}
            >
              <span className='material-symbols-outlined text-[20px]'>picture_as_pdf</span>
              Descargar Cotización PDF
            </button>
          )}
        </div>
      </div>

      {/* Quote Editor Overlay (Módulo 4) */}
      {isQuoteDrawerOpen && (
        <div className='fixed inset-0 z-[60] flex items-center justify-end bg-black/40 backdrop-blur-sm'>
          <div className='h-full w-full max-w-4xl bg-slate-50 shadow-2xl dark:bg-slate-950 flex flex-col'>
            {/* Header */}
            <div className='flex items-center justify-between border-b border-slate-200 bg-white px-8 py-4 dark:border-slate-800 dark:bg-slate-900'>
              <div>
                <h2 className='text-xl font-bold'>Cotizador</h2>
                <p className='text-xs text-slate-500'>Nueva cotización para {lead.contact_name}</p>
              </div>
              <button 
                onClick={() => setIsQuoteDrawerOpen(false)}
                className='rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800'
              >
                <span className='material-symbols-outlined'>close</span>
              </button>
            </div>

            {/* Content */}
            <div className='flex-1 overflow-y-auto bg-slate-50 p-8 dark:bg-slate-950'>
              <div className='mx-auto max-w-3xl space-y-8'>
                
                {/* Time Window Summary */}
                <div className='flex items-center gap-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/30 dark:bg-blue-900/10'>
                  <div className='flex size-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400'>
                    <span className='material-symbols-outlined'>schedule</span>
                  </div>
                  <div className='flex flex-1 items-center justify-between'>
                    <div>
                      <p className='text-[10px] font-bold uppercase tracking-widest text-blue-400'>Inicio de Reserva</p>
                      <p className='text-sm font-bold text-slate-900 dark:text-white'>
                        {formatLocalDate(lead.window_start, 'dd MMM, hh:mm a')}
                      </p>
                    </div>
                    <div className='h-8 w-px bg-blue-200 dark:bg-blue-800' />
                    <div className='text-right'>
                      <p className='text-[10px] font-bold uppercase tracking-widest text-blue-400'>Fin de Reserva</p>
                      <p className='text-sm font-bold text-slate-900 dark:text-white'>
                        {formatLocalDate(lead.window_end, 'dd MMM, hh:mm a')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Items Editor */}
                <QuoteItemsEditor 
                  items={quoteDraft?.items || []}
                  hours={(() => {
                    if (!lead.window_start || !lead.window_end) return 1
                    const diff = new Date(lead.window_end).getTime() - new Date(lead.window_start).getTime()
                    return Math.max(Math.ceil(diff / (1000 * 60 * 60)), 1)
                  })()}
                  onChange={(items: QuoteItem[]) => {
                    const totalAmount = items.reduce((acc, item) => acc + item.total, 0)
                    const subtotal = totalAmount / 1.16
                    const taxTotal = totalAmount - subtotal
                    
                    setQuoteDraft(prev => prev ? ({
                      ...prev,
                      items,
                      subtotal,
                      taxTotal,
                      totalAmount
                    }) : null)
                  }}
                />

                {/* Summary Table */}
                <div className='flex justify-end'>
                  <div className='w-full max-w-xs space-y-3 rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900'>
                    <div className='flex justify-between text-sm text-slate-500'>
                      <span>Subtotal</span>
                      <span className='font-mono font-bold text-slate-900 dark:text-white'>
                        {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(quoteDraft?.subtotal || 0)}
                      </span>
                    </div>
                    <div className='flex justify-between text-sm text-slate-500'>
                      <span>IVA (16%)</span>
                      <span className='font-mono font-bold text-slate-900 dark:text-white'>
                        {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(quoteDraft?.taxTotal || 0)}
                      </span>
                    </div>

                    <div className='my-2 border-t border-slate-100 dark:border-slate-800' />
                    <div className='flex justify-between text-lg font-bold'>
                      <span>Total</span>
                      <span className='text-blue-600'>
                        {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(quoteDraft?.totalAmount || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Additional Notes */}
                <div className='space-y-2'>
                  <p className='text-xs font-bold uppercase tracking-widest text-slate-400'>Notas de la Cotización</p>
                  <textarea 
                    value={quoteDraft?.notes || ''}
                    onChange={(e) => setQuoteDraft(prev => prev ? ({ ...prev, notes: e.target.value }) : null)}
                    className='w-full rounded-xl border border-slate-200 bg-white p-4 text-sm focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-900'
                    placeholder='Términos de pago, vigencia, etc...'
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className='flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-8 py-4 dark:border-slate-800 dark:bg-slate-900'>
              <button 
                onClick={() => setIsQuoteDrawerOpen(false)}
                className='px-6 py-2 text-sm font-bold text-slate-500 hover:text-slate-800'
              >
                Cancelar
              </button>

<button 
                className='flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-2.5 font-bold text-white shadow-lg transition-transform active:scale-95 disabled:opacity-50'
                disabled={saveQuoteMutation.isPending || acceptQuoteMutation.isPending}
                onClick={() => {
                   if (quoteDraft) {
                     // If already has ID (saved), we accept. If not, we save first.
                     if (quoteDraft.id) {
                       acceptQuoteMutation.mutate()
                     } else {
                       saveQuoteMutation.mutate(quoteDraft)
                     }
                   }
                }}
              >
                <span className='material-symbols-outlined text-[20px]'>
                  {saveQuoteMutation.isPending || acceptQuoteMutation.isPending ? 'sync' : (quoteDraft?.id ? 'check_circle' : 'save')}
                </span>
                {saveQuoteMutation.isPending 
                  ? 'Guardando...' 
                  : acceptQuoteMutation.isPending 
                    ? 'Procesando...' 
                    : (quoteDraft?.id ? 'Confirmar Reserva' : 'Guardar Cotización')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
