import { supabase } from '@/supabase/client'

/**
 * Uploads an equipment image to the `equipment-images` bucket.
 * @param file - The image File object to upload.
 * @param equipmentId - Used to scope the storage path.
 * @returns The public URL of the uploaded image.
 */
export async function uploadEquipmentImage(
  file: File,
  equipmentId: string
): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${equipmentId}/${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from('equipment-images')
    .upload(path, file, { upsert: true })

  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from('equipment-images').getPublicUrl(path)

  return data.publicUrl
}
