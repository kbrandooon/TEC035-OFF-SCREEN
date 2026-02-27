/** Represents a customer record from the `customers` table. */
export interface Customer {
  id: string
  tenant_id: string
  names: string
  last_name: string
  email: string | null
  phone: string | null
  created_at: string
  created_by: string | null
  updated_at: string | null
  updated_by: string | null
}

/** Input shape for creating or updating a customer. */
export interface CustomerFormValues {
  names: string
  last_name: string
  email: string
  phone: string
}
