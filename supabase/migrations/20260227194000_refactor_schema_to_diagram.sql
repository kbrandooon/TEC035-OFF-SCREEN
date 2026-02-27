-- =============================================================
-- Refactor schema to match the provided Mermaid diagram.
-- Drops: booking_details view, booking_equipments, bookings,
--        equipments, clients + all associated triggers/functions.
-- Creates: customers, equipment, reservations, inventory.
-- =============================================================

-- ── 1. Drop old view & triggers ──────────────────────────────
DROP VIEW IF EXISTS public.booking_details;

DROP TRIGGER IF EXISTS prevent_equipment_overlap ON public.booking_equipments;
DROP TRIGGER IF EXISTS prevent_booking_equipment_overlap ON public.bookings;
DROP FUNCTION IF EXISTS public.check_equipment_availability();
DROP FUNCTION IF EXISTS public.check_booking_equipment_availability();

-- ── 2. Drop old tables (order matters for FK constraints) ────
DROP TABLE IF EXISTS public.booking_equipments;
DROP TABLE IF EXISTS public.bookings;
DROP TABLE IF EXISTS public.equipments;
DROP TABLE IF EXISTS public.clients;

-- ── 3. Create customers ──────────────────────────────────────
CREATE TABLE public.customers (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    names       TEXT NOT NULL,
    last_name   TEXT NOT NULL,
    email       TEXT,
    phone       TEXT,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by  TEXT,
    updated_at  TIMESTAMP WITH TIME ZONE,
    updated_by  TEXT
);

-- ── 4. Create equipment ──────────────────────────────────────
CREATE TABLE public.equipment (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    name        TEXT NOT NULL,
    description TEXT,
    type        TEXT NOT NULL DEFAULT 'general',
    status      TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'maintenance', 'retired')),
    quantity    INTEGER NOT NULL DEFAULT 1,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by  TEXT,
    updated_at  TIMESTAMP WITH TIME ZONE,
    updated_by  TEXT
);

-- ── 5. Create reservations ───────────────────────────────────
CREATE TABLE public.reservations (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    customer_id  UUID REFERENCES public.customers(id) ON DELETE RESTRICT NOT NULL,
    equipment_id UUID REFERENCES public.equipment(id) ON DELETE RESTRICT NOT NULL,
    date         DATE NOT NULL,
    status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    hour         TIME NOT NULL,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by   TEXT,
    updated_at   TIMESTAMP WITH TIME ZONE,
    updated_by   TEXT
);

-- ── 6. Create inventory ──────────────────────────────────────
CREATE TABLE public.inventory (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    equipment_id  UUID REFERENCES public.equipment(id) ON DELETE RESTRICT NOT NULL,
    date          DATE NOT NULL DEFAULT CURRENT_DATE,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment')),
    quantity      INTEGER NOT NULL,
    clasification TEXT,
    description   TEXT,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by    TEXT,
    updated_at    TIMESTAMP WITH TIME ZONE,
    updated_by    TEXT
);

-- ── 7. Enable RLS ─────────────────────────────────────────────
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- ── 8. RLS Policies ──────────────────────────────────────────
-- customers
CREATE POLICY "Tenant isolation for customers - SELECT"
    ON public.customers FOR SELECT
    USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY "Tenant isolation for customers - ALL"
    ON public.customers FOR ALL
    USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid)
    WITH CHECK (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

-- equipment
CREATE POLICY "Tenant isolation for equipment - SELECT"
    ON public.equipment FOR SELECT
    USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY "Tenant isolation for equipment - ALL"
    ON public.equipment FOR ALL
    USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid)
    WITH CHECK (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

-- reservations
CREATE POLICY "Tenant isolation for reservations - SELECT"
    ON public.reservations FOR SELECT
    USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY "Tenant isolation for reservations - ALL"
    ON public.reservations FOR ALL
    USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid)
    WITH CHECK (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

-- inventory
CREATE POLICY "Tenant isolation for inventory - SELECT"
    ON public.inventory FOR SELECT
    USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY "Tenant isolation for inventory - ALL"
    ON public.inventory FOR ALL
    USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid)
    WITH CHECK (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);
