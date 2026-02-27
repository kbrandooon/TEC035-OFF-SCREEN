import { useAuth } from './use-auth'

/** Tenant roles as defined in the `roles` table */
export type TenantRole = 'admin' | 'manager' | 'employee'

/**
 * Returns the authenticated user's role within the active tenant,
 * derived from the `role` claim in the JWT `app_metadata`.
 *
 * @returns The role string, or `'employee'` as the safest default when unknown.
 */
export function useUserRole(): TenantRole {
  const { session } = useAuth()
  const role = session?.user?.app_metadata?.role as TenantRole | undefined
  return role ?? 'employee'
}

/** Human-readable Spanish label for each role */
export function useRoleLabel(): string {
  const role = useUserRole()
  const labels: Record<string, string> = {
    admin: 'Administrador',
    manager: 'Manager',
    employee: 'Empleado',
    viewer: 'Empleado', // legacy — JWT not yet refreshed after role rename
  }
  return labels[role] ?? role
}

/** Returns true if the user has admin-level access */
export function useIsAdmin(): boolean {
  return useUserRole() === 'admin'
}
