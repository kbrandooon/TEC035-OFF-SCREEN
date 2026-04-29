import { supabase } from '@/supabase/client'

/**
 * Returns the public URL of the first image found in the equipment's
 * storage folder: `equipment-images/{equipmentId}/`.
 *
 * The bucket is public so no signed URL is required.
 *
 * @param equipmentId - UUID of the equipment, used as the folder name.
 * @returns Public image URL or `null` if no image is uploaded yet.
 */
export async function getEquipmentImageUrl(
  equipmentId: string
): Promise<string | null> {
  const { data: files, error } = await supabase.storage
    .from('equipment-images')
    .list(equipmentId, { limit: 1, sortBy: { column: 'name', order: 'asc' } })

  if (error || !files?.length) return null

  const { data } = supabase.storage
    .from('equipment-images')
    .getPublicUrl(`${equipmentId}/${files[0].name}`)

  return data.publicUrl
}
