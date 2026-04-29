-- =============================================================================
-- Migration: client_portal_schema
-- Date: 2026-03-03
-- Purpose:
--   1. Allow client_profiles users to book equipment:
--      - Add `client_profile_id` FK to reservations
--      - Make `customer_id` nullable (admin flow keeps using it; client flow uses client_profile_id)
--   2. RLS: clients can SELECT all equipment (cross-tenant marketplace)
--   3. RLS: clients can INSERT their own reservations and SELECT them back
-- =============================================================================

-- ── 1. Extend reservations table ─────────────────────────────────────────────

ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS client_profile_id UUID
    REFERENCES public.client_profiles(id) ON DELETE SET NULL;

-- Make customer_id nullable so client reservations don't need a customers row
ALTER TABLE public.reservations
  ALTER COLUMN customer_id DROP NOT NULL;

COMMENT ON COLUMN public.reservations.client_profile_id IS
  'Set when the reservation was made by a portal client (role=cliente). '
  'Mutually exclusive with customer_id (admin-created reservations).';

-- ── 2. Equipment RLS — clients can read ALL equipment (marketplace) ──────────

-- Clients authenticated with role='cliente' in user_metadata can SELECT
-- equipment across all tenants. Existing tenant-isolation policies are
-- unchanged and still apply to admin users.

CREATE POLICY "Clients can view all equipment"
  ON public.equipment
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'cliente'
  );

CREATE POLICY "Clients can view all tenants"
  ON public.tenants
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'cliente'
  );

-- ── 3. Reservations RLS — clients can create and read their own ──────────────

CREATE POLICY "Clients can create their own reservations"
  ON public.reservations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'cliente'
    AND client_profile_id = auth.uid()
  );

CREATE POLICY "Clients can view their own reservations"
  ON public.reservations
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'cliente'
    AND client_profile_id = auth.uid()
  );
