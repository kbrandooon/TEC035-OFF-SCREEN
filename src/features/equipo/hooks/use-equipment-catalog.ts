import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/supabase/client'

export interface CatalogItem {
  id: string
  name: string
  image_url: string | null
  daily_rate: number
  category: string
}

/**
 * Fetches the full equipment and studio catalog for the current tenant.
 */
export function useEquipmentCatalog() {
  return useQuery({
    queryKey: ['equipment-catalog'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment')
        .select('id, name, image_url, daily_rate')
        .order('name', { ascending: true })
      
      if (error) throw error
      return (data || []) as CatalogItem[]
    },
  })
}
