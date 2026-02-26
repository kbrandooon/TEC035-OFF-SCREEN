---
name: expert-rbac
description: Expert standards for implementing Role-Based Access Control (RBAC/RBCA) in Supabase and React. Use this skill when designing permissions, RLS policies, custom JWT claims, or React-based role gating.
---

# Expert RBAC (Role-Based Access Control)

This skill provides a standard for implementing secure, scalable, and maintainable Role-Based Access Control (RBAC) within the project's ecosystem, primarily focusing on **Supabase (PostgreSQL)** and **React**.

## Core Principles

1.  **Least Privilege**: Users should only have the minimum access necessary to perform their tasks.
2.  **Database-First Security**: Enforce security at the database level using Row-Level Security (RLS) to ensure that even if the client is compromised, data remains protected.
3.  **Flat vs. Hierarchical Roles**: Use flat roles (e.g., `admin`, `manager`, `editor`, `viewer`) for simplicity unless complex hierarchies are strictly required.
4.  **Single Source of Truth**: User roles should be stored in a centralized database table (e.g., `user_roles`) and synchronized with Supabase Auth via Custom JWT Claims for performance.

## Database Implementation (Supabase/PostgreSQL)

### 1. Schema Design

Create a dedicated table for role management. Avoid hardcoding roles into app logic.

```sql
-- roles table
create table public.roles (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  description text
);

-- user_roles junction table
create table public.user_roles (
  user_id uuid references auth.users(id) on delete cascade,
  role_id uuid references public.roles(id) on delete cascade,
  primary key (user_id, role_id)
);
```

### 2. Custom JWT Claims

To avoid frequent database joins in RLS policies, use **Custom JWT Claims** to embed the user's role directly into the token. Use a Supabase database function triggered on user creation or manual role assignment.

> [!IMPORTANT]
> Use the `auth` hook pattern or a trigger to populate claims.

### 3. Row-Level Security (RLS) Policies

Implement policies that check for roles stored in the JWT claims.

```sql
-- Example: Allow users with 'admin' role to delete any customer
create policy "Admins can delete customers"
on public.customers
for delete
using (
  (auth.jwt() ->> 'role')::text = 'admin'
);

-- Example: Allow 'managers' to view customers in their assigned region
create policy "Managers can view regional customers"
on public.customers
for select
using (
  ((auth.jwt() ->> 'role')::text = 'manager')
  AND (region_id = (auth.jwt() ->> 'region_id')::uuid)
);
```

## React Implementation

### 1. Role Provider

Use a React Context to manage and expose the user's current role and permissions efficiently across the app.

### 2. Guard Components

Create reusable guard components for conditional rendering.

```tsx
/**
 * RoleGuard Component
 * @param allowedRoles - Array of roles permitted to view the children.
 */
export const RoleGuard = ({
  children,
  allowedRoles,
}: {
  children: React.ReactNode
  allowedRoles: string[]
}) => {
  const { userRole } = useAuth()
  if (!allowedRoles.includes(userRole)) return null
  return <> {children} </>
}
```

### 3. Hook-Based Checks

Use custom hooks for granular permission checks within component logic.

```ts
/**
 * Hook to check if current user has specific permission.
 */
export const useHasPermission = (permission: string) => {
  const { permissions } = useAuth()
  return permissions.includes(permission)
}
```

## Checklist for RBAC Implementation

- [ ] Roles are defined in the `roles` table.
- [ ] Junction table `user_roles` exists with proper foreign keys.
- [ ] Supabase RLS is enabled on all sensitive tables.
- [ ] RLS policies use `auth.jwt()` claims for role checks.
- [ ] A trigger or service updates `auth.users` claims when roles change.
- [ ] React `RoleGuard` or `useHasPermission` hook is used for UI gating.
- [ ] No sensitive data is exposed to users without appropriate roles.

## Common Mistakes to Avoid

- **Client-Side Only Security**: Never rely solely on React-side checks. Always back them with RLS.
- **Hardcoded Strings**: Avoid using magic strings for roles in code. Use a TypeScript enum or constant.
- **Over-fetching**: Ensure RLS policies don't introduce significant latency. Use indexes on columns used in `USING` clauses.
- **Ignoring Nulls**: Handle cases where `auth.jwt()` might be null or missing role claims gracefully.
