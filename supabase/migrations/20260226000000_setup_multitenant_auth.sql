-- 1. Create Tenants Table
CREATE TABLE public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Roles Table
CREATE TABLE public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT
);

-- 3. Create Profiles Table (1 User = 1 Studio constraint)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    email TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create User Roles Junction Table
CREATE TABLE public.user_roles (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- Insert roles first
INSERT INTO public.roles (name, description) VALUES 
('admin', 'Administrator with full access to the tenant'),
('manager', 'Manager with elevated access'),
('viewer', 'Read-only access to tenant data')
ON CONFLICT (name) DO NOTHING;

-- 5. Enable RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 6. Trigger to update Custom JWT claims in raw_app_meta_data
CREATE OR REPLACE FUNCTION public.update_user_jwt_claims()
RETURNS TRIGGER AS $$
DECLARE
    v_tenant_id UUID;
    v_role_name TEXT;
    v_target_id UUID;
BEGIN
    IF TG_TABLE_NAME = 'profiles' THEN
        v_target_id := NEW.id;
        v_tenant_id := NEW.tenant_id;
        
        SELECT r.name INTO v_role_name
        FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = v_target_id
        LIMIT 1;

    ELSIF TG_TABLE_NAME = 'user_roles' THEN
        v_target_id := NEW.user_id;

        SELECT tenant_id INTO v_tenant_id
        FROM public.profiles
        WHERE id = v_target_id;

        SELECT name INTO v_role_name
        FROM public.roles
        WHERE id = NEW.role_id;
    END IF;

    UPDATE auth.users
    SET raw_app_meta_data = 
        COALESCE(raw_app_meta_data, '{}'::jsonb) || 
        jsonb_build_object('tenant_id', v_tenant_id, 'role', COALESCE(v_role_name, 'viewer'))
    WHERE id = v_target_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created_or_updated ON public.profiles;
CREATE CONSTRAINT TRIGGER on_profile_created_or_updated
    AFTER INSERT OR UPDATE OF tenant_id ON public.profiles
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION public.update_user_jwt_claims();

DROP TRIGGER IF EXISTS on_user_role_created_or_updated ON public.user_roles;
CREATE CONSTRAINT TRIGGER on_user_role_created_or_updated
    AFTER INSERT OR UPDATE OF role_id ON public.user_roles
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION public.update_user_jwt_claims();

-- 7. RLS Policies using the JWT Claims

-- Tenants: users can only see their own tenant
CREATE POLICY "Users can view their own tenant"
ON public.tenants FOR SELECT
USING (id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

-- Profiles: Tenant Isolation
CREATE POLICY "Tenant isolation for profiles - SELECT"
ON public.profiles FOR SELECT
USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY "Tenant isolation for profiles - ALL (Admins)"
ON public.profiles FOR ALL
USING (
  tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid 
  AND (auth.jwt() -> 'app_metadata' ->> 'role')::text = 'admin'
)
WITH CHECK (
  tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid 
  AND (auth.jwt() -> 'app_metadata' ->> 'role')::text = 'admin'
);

-- Roles: Everyone can select
CREATE POLICY "Roles are viewable by everyone"
ON public.roles FOR SELECT USING (true);

-- User Roles: Tenant Isolation (Admins can view/manage)
CREATE POLICY "Tenant isolation for user_roles - SELECT"
ON public.user_roles FOR SELECT
USING (
  user_id IN (
    SELECT id FROM public.profiles WHERE tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
  )
);

CREATE POLICY "Tenant isolation for user_roles - ALL (Admins)"
ON public.user_roles FOR ALL
USING (
  user_id IN (
    SELECT id FROM public.profiles WHERE tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
  )
  AND (auth.jwt() -> 'app_metadata' ->> 'role')::text = 'admin'
)
WITH CHECK (
  user_id IN (
    SELECT id FROM public.profiles WHERE tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
  )
  AND (auth.jwt() -> 'app_metadata' ->> 'role')::text = 'admin'
);
