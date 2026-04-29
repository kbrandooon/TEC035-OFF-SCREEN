import { useEffect, useMemo, useState } from 'react'
import { getAllEquipment } from '../api/get-all-equipment'
import { useCartCtx } from '../context/cart-context'
import type { MarketplaceEquipment } from '../types'

const EQUIPMENT_TYPES: Record<string, string> = {
  camara: 'Cámaras',
  lente: 'Lentes',
  iluminacion: 'Iluminación',
  audio: 'Audio & Sonido',
  tramoya: 'Grip & Soportes',
  estudio: 'Estudio',
  video: 'Video',
  otros_accesorios: 'Accesorios',
}

export type CategoryFilter = string | null

/**
 * Manages marketplace state: fetches all equipment and applies
 * category, price-range, studio, and search filters.
 *
 * @returns Filtered equipment list, filter state setters, and loading state.
 */
export function useMarketplace() {
  const [all, setAll] = useState<MarketplaceEquipment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter state
  const [category, setCategory] = useState<CategoryFilter>(null)
  const [priceMax, setPriceMax] = useState<number>(50000)
  const [selectedStudios, setSelectedStudios] = useState<string[]>([])
  const { search } = useCartCtx()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    getAllEquipment()
      .then(setAll)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : 'Error al cargar equipo')
      )
      .finally(() => setIsLoading(false))
  }, [])

  /** Unique studios derived from the full equipment list. */
  const studios = useMemo(() => {
    const map = new Map<string, string>()
    all.forEach((e) => map.set(e.tenant_id, e.tenant_name))
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [all])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return all.filter((e) => {
      if (category && e.type !== category) return false
      if (e.daily_rate > priceMax) return false
      if (selectedStudios.length && !selectedStudios.includes(e.tenant_id))
        return false
      if (q && !e.name.toLowerCase().includes(q)) return false
      return true
    })
  }, [all, category, priceMax, selectedStudios, search])

  const toggleStudio = (id: string) =>
    setSelectedStudios((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )

  return {
    equipment: filtered,
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
  }
}
