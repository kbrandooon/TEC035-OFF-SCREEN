import { supabase } from '@/supabase/client'
import type { LeadStatus } from '../types'

/**
 * Updates the status of an existing lead.
 * 
 * @param leadId The ID of the lead to update.
 * @param status The new status to set.
 * @returns The updated lead ID or throws an error.
 */
export async function updateLeadStatus(leadId: string, status: LeadStatus) {
  const { error } = await supabase
    .from('leads')
    .update({ 
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', leadId)

  if (error) {
    throw new Error(error.message)
  }

  return leadId
}
