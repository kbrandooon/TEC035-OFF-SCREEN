-- Create leads table for StudioOS
-- Supports Module 1: Lead Capture and Module 2: WhatsApp Intake

CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    
    -- Contact Data
    contact_name TEXT NOT NULL,
    contact_email TEXT,
    contact_phone TEXT NOT NULL,
    company_name TEXT,
    
    -- Qualification / Request Data
    rental_kind TEXT NOT NULL, -- 'estudio', 'equipo'
    pax_count INTEGER DEFAULT 1,
    requires_invoice BOOLEAN DEFAULT FALSE,
    budget NUMERIC,
    notes TEXT,
    
    -- Window Data
    window_start TIMESTAMP WITH TIME ZONE NOT NULL,
    window_end TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Meta / Tracking
    source TEXT NOT NULL DEFAULT 'web', -- 'whatsapp', 'instagram', 'web'
    status TEXT NOT NULL DEFAULT 'nuevo', -- 'nuevo', 'calificado', 'perdido'
    
    -- Selected items (JSONB snapshot for MVP)
    equipment_ids UUID[] DEFAULT '{}',
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    submitted_by_user_id UUID REFERENCES auth.users(id)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS leads_tenant_id_idx ON public.leads(tenant_id);
CREATE INDEX IF NOT EXISTS leads_status_idx ON public.leads(status);

-- RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can see their own tenant's leads
CREATE POLICY "Leads are viewable by tenant members" 
ON public.leads FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.tenant_members 
        WHERE tenant_members.tenant_id = leads.tenant_id 
        AND tenant_members.user_id = auth.uid()
    )
);

-- Policy: Anonymous users can insert (via the public reservation form)
CREATE POLICY "Anyone can insert leads" 
ON public.leads FOR INSERT
WITH CHECK (true);
