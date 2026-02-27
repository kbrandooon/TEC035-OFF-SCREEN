import { supabase } from '@/supabase/client'

/**
 * Maps known error messages from the invite-employee Edge Function and
 * Supabase Auth into user-friendly Spanish strings.
 */
const ERROR_MAP: Record<string, string> = {
  // ── Supabase Auth — inviteUserByEmail ──────────────────────────────────────
  'A user with this email address has already been registered':
    'Ya existe una cuenta con este correo electrónico.',
  'User already registered':
    'Ya existe una cuenta con este correo electrónico.',
  'Email rate limit exceeded':
    'Se han enviado demasiadas invitaciones. Intenta de nuevo más tarde.',
  'Unable to validate email address: invalid format':
    'El formato del correo electrónico no es válido.',
  'Email link is invalid or has expired':
    'El enlace de invitación no es válido o ha expirado.',
  'Signup is disabled': 'El registro de nuevos usuarios está desactivado.',
  'Email signups are disabled': 'El registro por correo está desactivado.',

  // ── Edge Function — auth errors ────────────────────────────────────────────
  'Missing Authorization header':
    'Error de autenticación. Vuelve a iniciar sesión.',
  'Unauthorized: invalid session':
    'Tu sesión no es válida. Vuelve a iniciar sesión.',

  // ── Edge Function — permission errors ─────────────────────────────────────
  'Forbidden: solo los admins pueden invitar empleados':
    'Solo los administradores pueden invitar miembros al equipo.',

  // ── Edge Function — validation errors ─────────────────────────────────────
  'Se requiere email y roleId': 'El correo y el rol son obligatorios.',
  'Este usuario ya es miembro del estudio':
    'Este usuario ya pertenece a este estudio.',

  // ── Edge Function — DB / internal errors ──────────────────────────────────
  'Error al crear la invitación':
    'No se pudo crear la invitación. Intenta de nuevo.',
  'Error interno': 'Ocurrió un error interno. Intenta de nuevo.',
}

/**
 * Returns a translated Spanish error message for a known error string,
 * or a generic fallback if the message isn't mapped.
 */
function translateError(message: string): string {
  // Exact match first
  if (ERROR_MAP[message]) return ERROR_MAP[message]

  // Partial match for messages that may include dynamic values
  for (const [key, translation] of Object.entries(ERROR_MAP)) {
    if (message.toLowerCase().includes(key.toLowerCase())) return translation
  }

  return 'Ocurrió un error inesperado. Intenta de nuevo.'
}

/**
 * Sends an invitation to the given email via the `invite-employee` Edge Function.
 *
 * Returns the method used:
 * - `'email'`  → new user, magic-link invitation sent by email
 * - `'direct'` → existing user, added directly to the tenant (no email)
 *
 * @throws A translated Spanish error string on failure.
 */
export async function inviteMember(
  email: string,
  roleId: string
): Promise<{ method: 'email' | 'direct' }> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.access_token) {
    throw new Error('No hay sesión activa. Inicia sesión e intenta de nuevo.')
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

  const response = await fetch(`${supabaseUrl}/functions/v1/invite-employee`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ email, roleId }),
  })

  const body = (await response.json()) as {
    error?: string
    success?: boolean
    method?: 'email' | 'direct'
  }

  if (!response.ok || body.error) {
    const rawError = body.error ?? `Error ${response.status}`
    throw new Error(translateError(rawError))
  }

  return { method: body.method ?? 'email' }
}
