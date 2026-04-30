-- 1. Limpieza de Seguridad (Borrar si existe para evitar conflictos)
DROP POLICY IF EXISTS "Tenants can manage their own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Tenants can manage their own quote items" ON public.quote_items;

-- 2. Crear Tablas (IF NOT EXISTS para evitar errores)
CREATE TABLE IF NOT EXISTS public.quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    client_id UUID NOT NULL,
    client_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
    currency TEXT NOT NULL DEFAULT 'MXN',
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_total DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_total DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    notes TEXT,
    valid_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.quote_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
    equipment_id UUID REFERENCES public.equipment(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_rate DECIMAL(4,2) NOT NULL DEFAULT 0.16,
    total DECIMAL(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Habilitar RLS
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;

-- 4. Políticas Robustas (FOR ALL + WITH CHECK)
CREATE POLICY "Tenants can manage their own quotes" ON public.quotes
    FOR ALL 
    USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid)
    WITH CHECK (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY "Tenants can manage their own quote items" ON public.quote_items
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.quotes 
            WHERE quotes.id = quote_items.quote_id 
            AND quotes.tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.quotes 
            WHERE quotes.id = quote_items.quote_id 
            AND quotes.tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
        )
    );
