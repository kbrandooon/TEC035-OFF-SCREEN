import { useNavigate } from '@tanstack/react-router'
import { signOut } from '@/features/auth'
import { useMarketplace } from '../hooks/use-marketplace'
import { EquipmentCard } from './equipment-card'

/**
 * Full marketplace page: sidebar filters on the left, equipment grid/list on the right.
 */
export function MarketplacePage() {
  const navigate = useNavigate()
  const {
    equipment,
    isLoading,
    error,
    category,
    setCategory,
    priceMax,
    setPriceMax,
    selectedStudios,
    toggleStudio,
    viewMode,
    setViewMode,
    studios,
    EQUIPMENT_TYPES,
  } = useMarketplace()

  return (
    <div className='flex w-full gap-8 px-6 py-8'>
      {/* ── Sidebar ─────────────────────────────────── */}
      <aside className='sticky top-14 flex h-[calc(100vh-4.5rem)] w-56 shrink-0 flex-col overflow-y-auto py-8'>
        {/* Categories */}
        <div className='mb-8'>
          <p className='mb-3 text-[11px] font-bold tracking-widest text-slate-400 uppercase'>
            Categorías
          </p>
          <ul className='flex flex-col gap-1'>
            <li>
              <button
                onClick={() => setCategory(null)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                  category === null
                    ? 'bg-slate-100 font-bold text-slate-900'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <span className='material-symbols-outlined text-[18px] text-slate-400'>
                  apps
                </span>
                Todo
              </button>
            </li>
            {Object.entries(EQUIPMENT_TYPES).map(([key, label]) => (
              <li key={key}>
                <button
                  onClick={() => setCategory(key)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                    category === key
                      ? 'bg-slate-100 font-bold text-slate-900'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <span className='material-symbols-outlined text-[18px] text-slate-400'>
                    {key === 'camara'
                      ? 'photo_camera'
                      : key === 'iluminacion'
                        ? 'light_mode'
                        : key === 'audio'
                          ? 'mic'
                          : key === 'tramoya'
                            ? 'construction'
                            : key === 'lente'
                              ? 'lens'
                              : key === 'estudio'
                                ? 'domain'
                                : key === 'video'
                                  ? 'videocam'
                                  : 'category'}
                  </span>
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Price range */}
        <div className='mb-8'>
          <p className='mb-3 text-[11px] font-bold tracking-widest text-slate-400 uppercase'>
            Rango de Precio
          </p>
          <input
            type='range'
            min={0}
            max={50000}
            step={500}
            value={priceMax}
            onChange={(e) => setPriceMax(Number(e.target.value))}
            className='w-full accent-slate-900'
          />
          <div className='mt-1.5 flex justify-between text-xs text-slate-400'>
            <span>$0 / día</span>
            <span>${priceMax.toLocaleString('en-MX')} / día</span>
          </div>
        </div>

        {/* Studio / vendor */}
        {studios.length > 0 && (
          <div>
            <p className='mb-3 text-[11px] font-bold tracking-widest text-slate-400 uppercase'>
              Estudio / Vendor
            </p>
            <ul className='flex flex-col gap-1.5'>
              {studios.map((s) => (
                <li key={s.id}>
                  <label className='flex cursor-pointer items-center gap-2.5 text-sm text-slate-600 hover:text-slate-900'>
                    <input
                      type='checkbox'
                      checked={selectedStudios.includes(s.id)}
                      onChange={() => toggleStudio(s.id)}
                      className='rounded accent-slate-900'
                    />
                    {s.name}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}
        {/* Sign out */}
        <div className='mt-auto border-t border-slate-100 pt-6'>
          <button
            onClick={() => signOut().then(() => navigate({ to: '/' }))}
            className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600'
          >
            <span className='material-symbols-outlined text-[18px]'>
              logout
            </span>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────── */}
      <main className='min-w-0 flex-1'>
        {/* Header */}
        <div className='mb-6 flex items-start justify-between gap-4'>
          <div>
            <h1 className='text-2xl font-bold text-slate-900'>
              Marketplace de Equipos
            </h1>
            <p className='text-sm text-slate-500'>
              Equipos audiovisuales profesionales para alquiler diario.
            </p>
          </div>

          <div className='flex items-center gap-2'>
            {/* View toggle */}
            <button
              onClick={() => setViewMode('grid')}
              className={`rounded-lg p-1.5 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-400 hover:bg-slate-100'
              }`}
            >
              <span className='material-symbols-outlined text-[20px]'>
                grid_view
              </span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`rounded-lg p-1.5 transition-colors ${
                viewMode === 'list'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-400 hover:bg-slate-100'
              }`}
            >
              <span className='material-symbols-outlined text-[20px]'>
                view_list
              </span>
            </button>
          </div>
        </div>

        {/* States */}
        {isLoading && (
          <div className='flex h-64 items-center justify-center'>
            <div className='size-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-800' />
          </div>
        )}

        {error && !isLoading && (
          <div className='flex h-64 flex-col items-center justify-center gap-2 text-slate-400'>
            <span className='material-symbols-outlined text-[40px]'>error</span>
            <p className='text-sm'>{error}</p>
          </div>
        )}

        {!isLoading && !error && equipment.length === 0 && (
          <div className='flex h-64 flex-col items-center justify-center gap-2 text-slate-400'>
            <span className='material-symbols-outlined text-[40px]'>
              search_off
            </span>
            <p className='text-sm'>
              No hay equipos que coincidan con tu búsqueda.
            </p>
          </div>
        )}

        {!isLoading &&
          !error &&
          equipment.length > 0 &&
          (viewMode === 'grid' ? (
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
              {equipment.map((item) => (
                <EquipmentCard key={item.id} item={item} view='grid' />
              ))}
            </div>
          ) : (
            <div className='flex flex-col gap-3'>
              {equipment.map((item) => (
                <EquipmentCard key={item.id} item={item} view='list' />
              ))}
            </div>
          ))}
      </main>
    </div>
  )
}
