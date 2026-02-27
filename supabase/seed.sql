-- 1. Create the tenant
INSERT INTO public.tenants (id, name, slug)
VALUES (
    '11111111-1111-1111-1111-111111111111', 
    'Off Screen Studio', 
    'off-screen-studio'
) ON CONFLICT (id) DO NOTHING;

-- 2. Create the Auth User with email: admin@offscreen.com and password: password123
INSERT INTO auth.users (
    instance_id, 
    id, 
    aud, 
    role, 
    email, 
    encrypted_password, 
    email_confirmed_at, 
    raw_app_meta_data, 
    raw_user_meta_data, 
    created_at, 
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000', 
    '22222222-2222-2222-2222-222222222222', 
    'authenticated', 
    'authenticated', 
    'admin@offscreen.com', 
    crypt('password123', gen_salt('bf')), 
    now(), 
    '{"provider":"email","providers":["email"]}', 
    '{}', 
    now(), 
    now()
) ON CONFLICT (id) DO NOTHING;

-- 3. Create the inserted Auth User's identity
INSERT INTO auth.identities (
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
) VALUES (
    '22222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222222',
    format('{"sub":"%s","email":"%s"}', '22222222-2222-2222-2222-222222222222', 'admin@offscreen.com')::jsonb,
    'email',
    now(),
    now(),
    now()
) ON CONFLICT (provider, provider_id) DO NOTHING;

-- 4. Create the Profile linked to the tenant
INSERT INTO public.profiles (id, tenant_id, first_name, last_name, email)
VALUES (
    '22222222-2222-2222-2222-222222222222', 
    '11111111-1111-1111-1111-111111111111', 
    'Admin', 
    'Off Screen', 
    'admin@offscreen.com'
) ON CONFLICT (id) DO NOTHING;

-- 5. Assign Admin Role via tenant_members
INSERT INTO public.tenant_members (user_id, tenant_id, role_id)
SELECT
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    id
FROM public.roles
WHERE name = 'admin'
ON CONFLICT DO NOTHING;

-- 6. Set JWT claims for the seed user
UPDATE auth.users
SET raw_app_meta_data =
    COALESCE(raw_app_meta_data, '{}'::jsonb)
    || jsonb_build_object(
        'tenant_id', '11111111-1111-1111-1111-111111111111',
        'role', 'admin'
    )
WHERE id = '22222222-2222-2222-2222-222222222222';
