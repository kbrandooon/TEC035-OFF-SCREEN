import { useEffect, useRef, useState } from 'react'
import { uploadEquipmentImage } from '../api/upload-equipment-image'
import type {
  Equipment,
  EquipmentFormValues,
  EquipmentStatus,
  EquipmentType,
} from '../types'

interface EquipmentFormModalProps {
  equipment: Equipment | null
  isOpen: boolean
  isSaving: boolean
  error: string | null
  onClose: () => void
  onSave: (values: EquipmentFormValues) => Promise<void>
}

const TYPE_OPTIONS: { value: EquipmentType; label: string }[] = [
  { value: 'camara', label: 'Cámara' },
  { value: 'lente', label: 'Lente' },
  { value: 'iluminacion', label: 'Iluminación' },
  { value: 'tramoya', label: 'Tramoya' },
  { value: 'audio', label: 'Audio' },
  { value: 'video', label: 'Video' },
  { value: 'estudio', label: 'Estudio' },
  { value: 'otros_accesorios', label: 'Otros Accesorios' },
]

const STATUS_OPTIONS: { value: EquipmentStatus; label: string }[] = [
  { value: 'disponible', label: 'Disponible' },
  { value: 'mantenimiento', label: 'Mantenimiento' },
  { value: 'no_disponible', label: 'No Disponible' },
]

/**
 * Modal for creating or editing an equipment item.
 * Handles image upload to Supabase Storage before calling onSave.
 */
export function EquipmentFormModal({
  equipment,
  isOpen,
  isSaving,
  error,
  onClose,
  onSave,
}: EquipmentFormModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<EquipmentType>('camara')
  const [status, setStatus] = useState<EquipmentStatus>('disponible')
  const [dailyRate, setDailyRate] = useState<number>(0)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setName(equipment?.name ?? '')
    setDescription(equipment?.description ?? '')
    setType(equipment?.type ?? 'camara')
    setStatus(equipment?.status ?? 'disponible')
    setDailyRate(equipment?.daily_rate ?? 0)
    setImageFile(null)
    setImagePreview(equipment?.image_url ?? null)
    if (isOpen) setTimeout(() => nameRef.current?.focus(), 50)
  }, [equipment, isOpen])

  if (!isOpen) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUploading(true)
    try {
      let imageUrl = equipment?.image_url ?? null

      // Upload new image if selected (use a temporary ID for new equipment)
      if (imageFile) {
        const scopeId = equipment?.id ?? `new-${Date.now()}`
        imageUrl = await uploadEquipmentImage(imageFile, scopeId)
      } else if (!imagePreview) {
        // Image was explicitly removed
        imageUrl = null
      }

      await onSave({
        name,
        description,
        type,
        status,
        daily_rate: dailyRate,
        image_url: imageUrl,
      })
    } finally {
      setIsUploading(false)
    }
  }

  const busy = isSaving || isUploading

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm'
      onClick={(e) => e.target === e.currentTarget && !busy && onClose()}
    >
      <div className='relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800'>
        {/* Scrollable body */}
        <div className='max-h-[90vh] overflow-y-auto p-8'>
          {/* Close */}
          <button
            onClick={onClose}
            disabled={busy}
            className='absolute top-4 right-4 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40 dark:hover:bg-slate-700'
          >
            <span className='material-symbols-outlined text-[20px] font-normal'>
              close
            </span>
          </button>

          {/* Header */}
          <div className='mb-6 flex items-center gap-3'>
            <div className='flex size-12 items-center justify-center rounded-xl bg-slate-900 text-white shadow-lg dark:bg-slate-700'>
              <span className='material-symbols-outlined text-2xl font-normal'>
                {equipment ? 'edit' : 'add_circle'}
              </span>
            </div>
            <div>
              <h2 className='text-xl font-bold text-slate-900 dark:text-white'>
                {equipment ? 'Editar Equipo' : 'Nuevo Equipo'}
              </h2>
              <p className='text-sm text-slate-500 dark:text-slate-400'>
                {equipment
                  ? 'Actualiza la información del equipo.'
                  : 'Agrega un nuevo artículo al inventario.'}
              </p>
            </div>
          </div>

          {/* Form */}
          <form className='space-y-4' onSubmit={(e) => void handleSubmit(e)}>
            {/* Image upload */}
            <div>
              <label className='mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200'>
                Imagen del Equipo
              </label>
              {imagePreview ? (
                <div className='relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-600'>
                  <img
                    src={imagePreview}
                    alt='Preview'
                    className='h-48 w-full object-cover'
                  />
                  <button
                    type='button'
                    onClick={handleRemoveImage}
                    disabled={busy}
                    className='absolute top-2 right-2 flex size-8 items-center justify-center rounded-full bg-slate-900/70 text-white backdrop-blur-sm transition-colors hover:bg-red-600/80'
                    title='Eliminar imagen'
                  >
                    <span className='material-symbols-outlined text-[16px] font-normal'>
                      close
                    </span>
                  </button>
                  <button
                    type='button'
                    onClick={() => fileInputRef.current?.click()}
                    disabled={busy}
                    className='absolute right-2 bottom-2 flex items-center gap-1.5 rounded-lg bg-slate-900/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition-colors hover:bg-slate-900/90'
                  >
                    <span className='material-symbols-outlined text-[14px] font-normal'>
                      upload
                    </span>
                    Cambiar
                  </button>
                </div>
              ) : (
                <button
                  type='button'
                  onClick={() => fileInputRef.current?.click()}
                  disabled={busy}
                  className='flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 py-8 text-slate-400 transition-colors hover:border-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-700/30 dark:hover:border-slate-500'
                >
                  <span className='material-symbols-outlined text-[36px] font-normal'>
                    add_photo_alternate
                  </span>
                  <span className='text-sm font-medium'>
                    Haz clic para subir una imagen
                  </span>
                  <span className='text-xs'>JPG, PNG, WebP · Máx. 5 MB</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type='file'
                accept='image/jpeg,image/png,image/webp,image/gif'
                className='hidden'
                onChange={handleFileChange}
              />
            </div>

            {/* Name */}
            <div>
              <label
                htmlFor='equip-name'
                className='mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200'
              >
                Nombre <span className='text-red-500'>*</span>
              </label>
              <input
                id='equip-name'
                ref={nameRef}
                type='text'
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={busy}
                className='block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-none disabled:opacity-60 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-500'
                placeholder='Ej. Sony FX3 #1'
              />
            </div>

            {/* Type + Status */}
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label
                  htmlFor='equip-type'
                  className='mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200'
                >
                  Tipo <span className='text-red-500'>*</span>
                </label>
                <select
                  id='equip-type'
                  required
                  value={type}
                  onChange={(e) => setType(e.target.value as EquipmentType)}
                  disabled={busy}
                  className='block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-none disabled:opacity-60 dark:border-slate-600 dark:bg-slate-700 dark:text-white'
                >
                  {TYPE_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor='equip-status'
                  className='mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200'
                >
                  Estado <span className='text-red-500'>*</span>
                </label>
                <select
                  id='equip-status'
                  required
                  value={status}
                  onChange={(e) => setStatus(e.target.value as EquipmentStatus)}
                  disabled={busy}
                  className='block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-none disabled:opacity-60 dark:border-slate-600 dark:bg-slate-700 dark:text-white'
                >
                  {STATUS_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tarifa por Día */}
            <div>
              <label
                htmlFor='equip-daily-rate'
                className='mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200'
              >
                Tarifa por Día (MXN)
              </label>
              <div className='relative'>
                <span className='pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm font-bold text-slate-400'>
                  $
                </span>
                <input
                  id='equip-daily-rate'
                  type='number'
                  min={0}
                  step='any'
                  value={dailyRate || ''}
                  onChange={(e) =>
                    setDailyRate(parseFloat(e.target.value) || 0)
                  }
                  disabled={busy}
                  placeholder='0.00'
                  className='block w-full rounded-lg border border-slate-300 py-2.5 pr-3 pl-7 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-none disabled:opacity-60 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-500'
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor='equip-description'
                className='mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200'
              >
                Descripción
              </label>
              <textarea
                id='equip-description'
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={busy}
                className='block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-none disabled:opacity-60 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-500'
                placeholder='Detalles adicionales del equipo...'
              />
            </div>

            {error && (
              <div className='rounded-lg border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-600 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400'>
                {error}
              </div>
            )}

            {isUploading && (
              <div className='flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm font-medium text-blue-600 dark:border-blue-900/30 dark:bg-blue-900/20 dark:text-blue-400'>
                <span className='material-symbols-outlined animate-spin text-[16px] font-normal'>
                  progress_activity
                </span>
                {equipment ? 'Actualizando producto...' : 'Agregando Equipo...'}
              </div>
            )}

            {/* Actions */}
            <div className='flex gap-3 pt-2'>
              <button
                type='button'
                onClick={onClose}
                disabled={busy}
                className='flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700'
              >
                Cancelar
              </button>
              <button
                type='submit'
                disabled={busy || !name.trim()}
                className='bg-primary hover:bg-primary-hover flex-1 rounded-lg px-4 py-2.5 text-sm font-bold text-white shadow transition-colors disabled:opacity-60'
              >
                {busy
                  ? 'Guardando...'
                  : equipment
                    ? 'Guardar Cambios'
                    : 'Agregar Equipo'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
