CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA extensions;

-- 1. Create Clients Table
CREATE TABLE public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Equipments Table
CREATE TABLE public.equipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('camera', 'lighting', 'grip', 'general')),
    serial_number TEXT,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'maintenance', 'retired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Bookings Table
CREATE TABLE public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE RESTRICT NOT NULL,
    title TEXT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    hourly_rate NUMERIC(10, 2) NOT NULL DEFAULT 0,
    requires_invoice BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT check_time_range CHECK (start_time < end_time),
    CONSTRAINT prevent_overlapping_bookings EXCLUDE USING gist (
        tenant_id WITH =,
        tstzrange(start_time, end_time) WITH &&
    ) WHERE (status IN ('pending', 'confirmed'))
);

-- 4. Create Booking Equipments Table (Junction)
CREATE TABLE public.booking_equipments (
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
    equipment_id UUID REFERENCES public.equipments(id) ON DELETE RESTRICT NOT NULL,
    PRIMARY KEY (booking_id, equipment_id)
);

-- 5. Triggers to prevent equipment overlap
CREATE OR REPLACE FUNCTION public.check_equipment_availability()
RETURNS TRIGGER AS $$
DECLARE
    v_booking_start TIMESTAMP WITH TIME ZONE;
    v_booking_end TIMESTAMP WITH TIME ZONE;
    v_conflict_exists BOOLEAN;
BEGIN
    SELECT start_time, end_time INTO v_booking_start, v_booking_end
    FROM public.bookings
    WHERE id = NEW.booking_id;

    SELECT EXISTS (
        SELECT 1
        FROM public.booking_equipments be
        JOIN public.bookings b ON be.booking_id = b.id
        WHERE be.equipment_id = NEW.equipment_id
          AND be.booking_id != NEW.booking_id
          AND b.status IN ('pending', 'confirmed')
          AND b.start_time < v_booking_end
          AND b.end_time > v_booking_start
    ) INTO v_conflict_exists;

    IF v_conflict_exists THEN
        RAISE EXCEPTION 'Equipment % is already booked during this time range', NEW.equipment_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_equipment_overlap
    BEFORE INSERT OR UPDATE ON public.booking_equipments
    FOR EACH ROW
    EXECUTE FUNCTION public.check_equipment_availability();


CREATE OR REPLACE FUNCTION public.check_booking_equipment_availability()
RETURNS TRIGGER AS $$
DECLARE
    v_conflict_exists BOOLEAN;
BEGIN
    IF NEW.start_time = OLD.start_time AND NEW.end_time = OLD.end_time AND NEW.status = OLD.status THEN
        RETURN NEW;
    END IF;
    
    IF NEW.status = 'cancelled' THEN
        RETURN NEW;
    END IF;

    SELECT EXISTS (
        SELECT 1
        FROM public.booking_equipments be
        JOIN public.booking_equipments be_other ON be.equipment_id = be_other.equipment_id
        JOIN public.bookings b_other ON be_other.booking_id = b_other.id
        WHERE be.booking_id = NEW.id
          AND b_other.id != NEW.id
          AND b_other.status IN ('pending', 'confirmed')
          AND b_other.start_time < NEW.end_time
          AND b_other.end_time > NEW.start_time
    ) INTO v_conflict_exists;

    IF v_conflict_exists THEN
        RAISE EXCEPTION 'One or more assigned equipment items are already booked during the new time range';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_booking_equipment_overlap
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.check_booking_equipment_availability();

-- 6. Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_equipments ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies
CREATE POLICY "Tenant isolation for clients - SELECT" ON public.clients FOR SELECT USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);
CREATE POLICY "Tenant isolation for clients - ALL" ON public.clients FOR ALL USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid) WITH CHECK (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY "Tenant isolation for equipments - SELECT" ON public.equipments FOR SELECT USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);
CREATE POLICY "Tenant isolation for equipments - ALL" ON public.equipments FOR ALL USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid) WITH CHECK (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY "Tenant isolation for bookings - SELECT" ON public.bookings FOR SELECT USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);
CREATE POLICY "Tenant isolation for bookings - ALL" ON public.bookings FOR ALL USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid) WITH CHECK (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY "Tenant isolation for booking_equipments - SELECT" ON public.booking_equipments FOR SELECT USING (booking_id IN (SELECT id FROM public.bookings WHERE tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));
CREATE POLICY "Tenant isolation for booking_equipments - ALL" ON public.booking_equipments FOR ALL USING (booking_id IN (SELECT id FROM public.bookings WHERE tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid)) WITH CHECK (booking_id IN (SELECT id FROM public.bookings WHERE tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

-- 8. Booking Details View (Security Invoker handles RLS automatically in Postgres 15+)
CREATE OR REPLACE VIEW public.booking_details WITH (security_invoker = on) AS
SELECT 
    b.id,
    b.tenant_id,
    b.client_id,
    c.name AS client_name,
    b.title,
    b.start_time,
    b.end_time,
    b.hourly_rate,
    b.requires_invoice,
    b.status,
    b.notes,
    b.created_at,
    (EXTRACT(EPOCH FROM (b.end_time - b.start_time))/3600)::NUMERIC(10, 2) AS total_hours,
    ((EXTRACT(EPOCH FROM (b.end_time - b.start_time))/3600) * b.hourly_rate)::NUMERIC(10, 2) AS subtotal,
    CASE 
        WHEN b.requires_invoice THEN (((EXTRACT(EPOCH FROM (b.end_time - b.start_time))/3600) * b.hourly_rate) * 0.16)::NUMERIC(10, 2)
        ELSE 0 
    END AS tax_amount,
    CASE 
        WHEN b.requires_invoice THEN (((EXTRACT(EPOCH FROM (b.end_time - b.start_time))/3600) * b.hourly_rate) * 1.16)::NUMERIC(10, 2)
        ELSE ((EXTRACT(EPOCH FROM (b.end_time - b.start_time))/3600) * b.hourly_rate)::NUMERIC(10, 2)
    END AS total_amount
FROM public.bookings b
LEFT JOIN public.clients c ON b.client_id = c.id;
