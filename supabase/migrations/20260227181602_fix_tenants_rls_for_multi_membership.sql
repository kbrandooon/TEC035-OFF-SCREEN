-- =============================================================================
-- Fix: allow users to see ALL tenants they are a member of (not just the active one)
-- =============================================================================

-- PROBLEM:
--   The existing "Users can view their own tenant" policy filters tenants to
--   only the JWT's active tenant_id. The get_my_tenants() RPC joins tenants
--   with tenant_members, but the tenants RLS limits the result to 1 row.
--
-- FIX:
--   1. Add a policy on tenant_members so users can see ALL their own memberships
--      (not only those of the active tenant).
--   2. Add a policy on tenants so users can see any tenant they are a member of.

-- ── tenant_members: allow users to see all their own rows ─────────────────────
CREATE POLICY "tenant_members_select_own"
ON public.tenant_members FOR SELECT
USING (user_id = auth.uid());

-- ── tenants: allow access to any tenant the user is a member of ───────────────
CREATE POLICY "tenants_select_all_memberships"
ON public.tenants FOR SELECT
USING (
    id IN (
        SELECT tenant_id
        FROM public.tenant_members
        WHERE user_id = auth.uid()
    )
);
