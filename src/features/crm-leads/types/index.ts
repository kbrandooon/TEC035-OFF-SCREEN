export type LeadStatus = 'nuevo' | 'calificado' | 'aceptado' | 'perdido' | 'cotizado' | 'reservado' | 'completado' | 'cancelado'
export type LeadSource = 'whatsapp' | 'instagram' | 'web'

export interface Lead {
  id: string
  tenant_id: string
  created_at: string
  updated_at: string
  
  // Contact Info
  contact_name: string
  contact_email: string | null
  contact_phone: string
  company_name: string | null
  
  // Qualification
  rental_kind: 'estudio' | 'equipo'
  pax_count: number
  requires_invoice: boolean
  budget: number | null
  notes: string | null
  
  // Window
  window_start: string
  window_end: string
  
  // Meta
  source: LeadSource
  status: LeadStatus
  
  // Relations (simplified for MVP)
  equipment_ids: string[]
}

export interface LeadsFilter {
  status?: LeadStatus
  source?: LeadSource
  search?: string
}
