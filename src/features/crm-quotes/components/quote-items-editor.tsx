import { useState } from 'react'
import type { QuoteItem } from '../types/quote.types'
import { useEquipmentCatalog } from '@/features/equipo/hooks/use-equipment-catalog'

interface QuoteItemsEditorProps {
  items: QuoteItem[]
  hours: number
  onChange: (items: QuoteItem[]) => void
}

/**
 * Editor for quote line items with conditional total/hourly pricing.
 */
export function QuoteItemsEditor({ items, hours, onChange }: QuoteItemsEditorProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [canCustomize, setCanCustomize] = useState(false)
  
  const { data: catalog = [], isLoading: isLoadingCatalog } = useEquipmentCatalog()

  const filteredCatalog = catalog.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.category?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const updateItem = (index: number, updates: Partial<QuoteItem>) => {
    const newItems = [...items]
    const updatedItem = { ...newItems[index], ...updates }
    
    // If not customizing, recalculate total based on price/hours
    if (!canCustomize && (updates.unitPrice !== undefined || updates.quantity !== undefined)) {
       updatedItem.total = updatedItem.quantity * updatedItem.unitPrice * hours
    }
    
    newItems[index] = updatedItem
    onChange(newItems)
  }

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index))
  }

  const fmtMXN = (val: number) => 
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val)

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <h3 className='text-sm font-bold uppercase tracking-wider text-slate-500'>Artículos y Servicios</h3>
          <div className='flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 dark:border-slate-800'>
            <input 
              type='checkbox' 
              id='customize-costs'
              checked={canCustomize}
              onChange={(e) => {
                const checked = e.target.checked
                setCanCustomize(checked)
                
                // If turning OFF customization, reset all totals to standard formula
                if (!checked) {
                  const resetItems = items.map(item => ({
                    ...item,
                    total: item.quantity * item.unitPrice * hours
                  }))
                  onChange(resetItems)
                }
              }}
              className='size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500'
            />
            <label htmlFor='customize-costs' className='text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer text-nowrap'>
              Personalizar totales
            </label>
          </div>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className='flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700'
        >
          <span className='material-symbols-outlined text-[18px]'>add_circle</span>
          Agregar Concepto
        </button>
      </div>

      <div className='overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'>
        <table className='w-full text-left text-sm'>
          <thead className='bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:bg-slate-800/50'>
            <tr>
              <th className='px-4 py-3'>Descripción</th>
              <th className='w-20 px-4 py-3 text-center'>Cant.</th>
              {!canCustomize && <th className='w-32 px-4 py-3 text-right'>Costo/Hr</th>}
              <th className='w-40 px-4 py-3 text-right'>Total Neto</th>
              <th className='w-10 px-4 py-3'></th>
            </tr>
          </thead>
          <tbody className='divide-y divide-slate-100 dark:divide-slate-800'>
            {items.length === 0 ? (
              <tr>
                <td colSpan={canCustomize ? 4 : 5} className='px-4 py-12 text-center text-slate-400'>
                  No hay artículos en esta cotización.
                </td>
              </tr>
            ) : (
              items.map((item, idx) => (
                <tr key={item.equipmentId || idx} className='group hover:bg-slate-50/50 dark:hover:bg-slate-800/30'>
                  <td className='px-4 py-3'>
                    <input 
                      value={item.name}
                      readOnly={!canCustomize}
                      onChange={(e) => updateItem(idx, { name: e.target.value })}
                      className={`w-full bg-transparent font-medium focus:outline-none ${!canCustomize ? 'cursor-default' : ''}`}
                    />
                  </td>
                  <td className='px-4 py-3 text-center'>
                    <input 
                      type='number'
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })}
                      className='w-full bg-transparent text-center focus:outline-none'
                    />
                  </td>
                  {!canCustomize && (
                    <td className='px-4 py-3 text-right text-slate-400 font-mono'>
                      {fmtMXN(item.unitPrice)}
                    </td>
                  )}
                  <td className='px-4 py-3 text-right'>
                    <input 
                      type='number'
                      value={item.total}
                      readOnly={!canCustomize}
                      onChange={(e) => updateItem(idx, { total: Number(e.target.value) })}
                      className={`w-full bg-transparent text-right font-bold tabular-nums focus:outline-none ${!canCustomize ? 'cursor-default' : 'text-blue-600 underline decoration-dotted'}`}
                    />
                    {!canCustomize && <span className='hidden'>{fmtMXN(item.total)}</span>}
                  </td>
                  <td className='px-4 py-3 text-right'>
                    <button 
                      onClick={() => removeItem(idx)}
                      className='text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100'
                    >
                      <span className='material-symbols-outlined text-[18px]'>delete</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isAdding && (
        <div className='rounded-xl border-2 border-dashed border-slate-200 p-4 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl relative z-10'>
           <div className='flex gap-3 mb-4'>
             <div className='relative flex-1'>
               <span className='material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]'>search</span>
               <input 
                 autoFocus
                 placeholder='Buscar equipo o estudio...' 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className='w-full rounded-lg border border-slate-200 pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950'
                 onKeyDown={(e) => {
                   if (e.key === 'Escape') setIsAdding(false)
                 }}
               />
             </div>
             <button 
               onClick={() => { setIsAdding(false); setSearchTerm('') }}
               className='px-3 py-2 text-xs font-bold text-slate-400 hover:text-slate-600'
             >
               Cerrar
             </button>
           </div>

           <div className='max-h-60 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800'>
             {isLoadingCatalog ? (
               <div className='py-4 text-center text-xs text-slate-400'>Cargando catálogo...</div>
             ) : filteredCatalog.length === 0 ? (
               <div className='py-4 text-center text-xs text-slate-400'>No se encontraron resultados</div>
             ) : (
               filteredCatalog.map(item => (
                 <button
                   key={item.id}
                   onClick={() => {
                     const newItem: QuoteItem = {
                       equipmentId: item.id,
                       name: item.name,
                       quantity: 1,
                       unitPrice: item.daily_rate,
                       total: item.daily_rate * hours,
                       taxRate: 0.16,
                       discount: 0
                     }
                     onChange([...items, newItem])
                     setIsAdding(false)
                     setSearchTerm('')
                   }}
                   className='flex w-full items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left group'
                 >
                   <div className='size-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden'>
                     {item.image_url ? (
                       <img src={item.image_url} alt={item.name} className='size-full object-cover' />
                     ) : (
                       <span className='material-symbols-outlined text-slate-400 text-[20px]'>videocam</span>
                     )}
                   </div>
                   <div className='flex-1'>
                     <p className='text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600'>{item.name}</p>
                     <p className='text-[10px] text-slate-400 uppercase'>{item.category || 'Equipo'}</p>
                   </div>
                   <div className='text-right'>
                     <p className='text-xs font-mono font-bold text-slate-900 dark:text-white'>
                       ${item.daily_rate}/hr
                     </p>
                   </div>
                 </button>
               ))
             )}
           </div>
        </div>
      )}
    </div>
  )
}
