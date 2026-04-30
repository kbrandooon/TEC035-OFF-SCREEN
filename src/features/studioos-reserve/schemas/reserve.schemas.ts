import { z } from 'zod'

// ---------------------------------------------------------------------------
// Contact form — step 4 of the public reservation wizard
// ---------------------------------------------------------------------------

/**
 * Validates the contact information the requester fills out before submitting.
 * Email is lowercased on transform to normalize display-only inconsistencies.
 */
export const reserveContactSchema = z.object({
  contactName: z
    .string()
    .min(1, 'El nombre es obligatorio.')
    .max(120, 'El nombre no puede superar 120 caracteres.'),

  contactEmail: z
    .string()
    .min(1, 'El correo es obligatorio.')
    .email('Ingresa un correo electrónico válido.')
    .max(254, 'El correo no puede superar 254 caracteres.')
    .transform((v) => v.toLowerCase().trim()),

  contactPhone: z
    .string()
    .min(1, 'El teléfono es obligatorio.')
    .max(48, 'El teléfono no puede superar 48 caracteres.'),

  companyName: z.string().max(120, 'El nombre de empresa no puede superar 120 caracteres.').optional().or(z.literal('')),
  
  paxCount: z.coerce.number().min(1, 'Mínimo 1 persona.').max(500, 'Máximo 500 personas.'),
  
  requiresInvoice: z.boolean().default(false),
  
  budget: z.coerce.number().min(0, 'El presupuesto debe ser positivo.').optional().or(z.literal(0)).or(z.null()),

  notes: z.string().max(500, 'Las notas no pueden superar 500 caracteres.').optional().or(z.literal('')),
})

// ---------------------------------------------------------------------------
// Date/time window — step 2 of the public reservation wizard
// ---------------------------------------------------------------------------

/**
 * Validates the reservation time window submitted in step 2.
 */
export const reserveWindowSchema = z
  .object({
    startDate: z.string().min(1, 'Selecciona la fecha de inicio.'),
    endDate: z.string().min(1, 'Selecciona la fecha de fin.'),
    startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Hora de inicio no válida.'),
    endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Hora de fin no válida.'),
  })
  .refine(
    ({ startDate, startTime, endDate, endTime }) => {
      const norm = (t: string) => (t.length === 5 ? `${t}:00` : t)
      const start = new Date(`${startDate}T${norm(startTime)}`).getTime()
      const end = new Date(`${endDate}T${norm(endTime)}`).getTime()
      return !Number.isNaN(start) && !Number.isNaN(end) && end > start
    },
    {
      message:
        'La fecha y hora de fin deben ser posteriores a la fecha y hora de inicio.',
      path: ['endTime'],
    }
  )
