import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/supabase/client'

/**
 * Fetches equipment details for a list of IDs.
 * Used to display equipment snapshots in Leads and Quotes.
 */
export function useEquipmentByIds(ids: string[]) {
  return useQuery({
    queryKey: ['equipment-by-ids', ids],
    queryFn: async () => {
      if (!ids || ids.length === 0) return []
      
      const { data, error } = await supabase
        .from('equipment')
        .select('id, name, image_url, daily_rate')
        .in('id', ids)
      
      if (error) throw error
      return data || []
    },
    enabled: ids.length > 0,
  })
}
