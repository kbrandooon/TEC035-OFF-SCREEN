import { formatLocalDate } from '@/utils/date-utils'
import type { Quote } from '../types/quote.types'

interface QuotePrintViewProps {
  quote: Partial<Quote>
}

/**
 * Professional print-ready view for quotes.
 * Hidden on screen, visible only during print (@media print).
 */
export function QuotePrintView({ quote }: QuotePrintViewProps) {
  const fmtMXN = (val: number) => 
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val || 0)

  return (
    <div className='hidden print:block print:p-8 bg-white text-slate-900 min-h-screen font-sans'>
      {/* Header */}
      <div className='flex justify-between border-b-2 border-slate-900 pb-8'>
        <div>
          <h1 className='text-4xl font-black tracking-tighter uppercase'>StudioOS</h1>
          <p className='text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest'>Plataforma de Gestión Creativa</p>
        </div>
        <div className='text-right'>
          <h2 className='text-2xl font-bold uppercase'>Cotización</h2>
          <p className='text-sm font-mono text-slate-500'>#{quote.id?.slice(0, 8).toUpperCase() || 'DRAFT'}</p>
          <p className='text-sm mt-2'>{new Date().toLocaleDateString('es-MX', { dateStyle: 'long' })}</p>
        </div>
      </div>

      {/* Info Sections */}
      <div className='grid grid-cols-2 gap-12 my-10'>
        <div>
          <p className='text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2'>Cliente / Proyecto</p>
          <p className='text-lg font-bold'>{quote.clientName || 'Sin nombre'}</p>
          {quote.notes && <p className='text-sm text-slate-600 mt-2 italic'>"{quote.notes}"</p>}
        </div>
        <div className='text-right'>
          <p className='text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2'>Detalles del Servicio</p>
          <p className='text-sm font-bold'>Moneda: <span className='font-mono'>{quote.currency}</span></p>
          <p className='text-sm'>Estatus: <span className='uppercase font-bold text-blue-600'>{quote.status}</span></p>
        </div>
      </div>

      {/* Table */}
      <table className='w-full border-collapse mb-10'>
        <thead>
          <tr className='bg-slate-900 text-white'>
            <th className='p-3 text-left text-xs uppercase font-bold tracking-widest'>Descripción</th>
            <th className='p-3 text-center text-xs uppercase font-bold tracking-widest'>Cant.</th>
            <th className='p-3 text-right text-xs uppercase font-bold tracking-widest'>Costo Unit.</th>
            <th className='p-3 text-right text-xs uppercase font-bold tracking-widest'>Total Neto</th>
          </tr>
        </thead>
        <tbody className='divide-y divide-slate-200'>
          {quote.items?.map((item, idx) => (
            <tr key={idx}>
              <td className='p-3 py-4'>
                <p className='font-bold text-sm'>{item.name}</p>
                <p className='text-[10px] text-slate-400 uppercase tracking-tight'>Servicio de Producción / Equipo</p>
              </td>
              <td className='p-3 text-center text-sm font-mono'>{item.quantity}</td>
              <td className='p-3 text-right text-sm font-mono'>{fmtMXN(item.unitPrice)}</td>
              <td className='p-3 text-right text-sm font-bold font-mono'>{fmtMXN(item.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer Totals */}
      <div className='flex justify-end'>
        <div className='w-64 space-y-3'>
          <div className='flex justify-between text-sm text-slate-500'>
            <span>Subtotal</span>
            <span className='font-mono'>{fmtMXN(quote.subtotal || 0)}</span>
          </div>
          <div className='flex justify-between text-sm text-slate-500'>
            <span>IVA (16%)</span>
            <span className='font-mono'>{fmtMXN(quote.tax_total || quote.taxTotal || 0)}</span>
          </div>
          <div className='flex justify-between border-t-2 border-slate-900 pt-3 text-xl font-black'>
            <span>TOTAL</span>
            <span className='font-mono'>{fmtMXN(quote.total_amount || 0)}</span>
          </div>
        </div>
      </div>

      {/* Legal & Terms */}
      <div className='mt-20 pt-10 border-t border-slate-100 text-[10px] text-slate-400 leading-relaxed'>
        <p className='font-bold text-slate-600 mb-2'>TÉRMINOS Y CONDICIONES</p>
        <p>• Esta cotización tiene una vigencia de 15 días naturales a partir de su fecha de emisión.</p>
        <p>• Los precios están sujetos a cambios sin previo aviso si el proyecto sufre modificaciones en tiempos o requerimientos.</p>
        <p>• El equipo reservado está sujeto a disponibilidad hasta la confirmación mediante anticipo.</p>
        <div className='mt-8 text-center'>
          <p className='font-black text-slate-900 italic'>¡Gracias por crear con StudioOS!</p>
        </div>
      </div>
    </div>
  )
}
