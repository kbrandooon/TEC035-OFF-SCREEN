import { supabase } from '@/supabase/client'
import type { VerifyOtpParams } from '@supabase/supabase-js'

/**
 * Verify an OTP code.
 */
export async function verifyOtp(params: VerifyOtpParams) {
  const { data, error } = await supabase.auth.verifyOtp(params)
  if (error) throw error
  return data
}
