/**
 * Utility function to translate standard English Supabase Auth error messages
 * into user-friendly Spanish messages.
 */
export function translateAuthError(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Ocurrió un error inesperado al procesar tu solicitud.'
  }

  const msg = error.message.toLowerCase()

  // Login Errors
  if (msg.includes('invalid login credentials')) {
    return 'Correo o contraseña incorrectos. Verifica tus datos.'
  }
  if (msg.includes('email not confirmed')) {
    return 'Debes confirmar tu correo electrónico antes de iniciar sesión.'
  }
  if (msg.includes('user not found')) {
    return 'No hemos encontrado un usuario con este correo electrónico.'
  }

  // OTP / Forgot Password Errors
  if (msg.includes('token has expired') || msg.includes('invalid token')) {
    return 'El código ingresado es incorrecto o ya ha expirado. Solicita uno nuevo.'
  }
  if (msg.includes('otp expired')) {
    return 'El código numérico ha expirado. Solicita uno nuevo.'
  }
  if (msg.includes('for security purposes')) {
    return 'Por motivos de seguridad, espera un momento antes de solicitar otro código.'
  }

  // Signup Errors
  if (msg.includes('user already registered')) {
    return 'Este correo electrónico ya está registrado.'
  }
  if (msg.includes('password should be at least')) {
    return 'La contraseña es demasiado corta. Debe tener al menos 6 caracteres.'
  }

  // Rate limits
  if (
    msg.includes('rate limit exceeded') ||
    msg.includes('too many requests')
  ) {
    return 'Demasiados intentos. Por favor, espera unos minutos e intenta nuevamente.'
  }

  // Fallback (Devuelve el error original si no está mapeado,
  // ideal para que descubras nuevos errores en consola y los mapees aquí después).
  return error.message
}
