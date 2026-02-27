export interface Profile {
  id: string
  tenant_id: string
  first_name: string | null
  last_name: string | null
  email: string
  is_active: boolean
  created_at: string
  updated_at: string
}
