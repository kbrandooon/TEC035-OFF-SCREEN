-- Function to create a new tenant and assign the current user as an admin
-- Uses SECURITY DEFINER to bypass RLS since the user doesn't have a tenant yet
CREATE OR REPLACE FUNCTION public.create_new_tenant_with_admin(
  p_tenant_name TEXT,
  p_first_name TEXT,
  p_last_name TEXT
) RETURNS UUID AS $$
DECLARE
  v_tenant_id UUID;
  v_user_id UUID;
  v_role_id UUID;
  v_email TEXT;
  v_slug TEXT;
BEGIN
  -- 1. Get the current authenticated user's ID and Email
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = v_user_id;

  -- 2. Check if the user already has a profile. If they do, they already belong to a tenant.
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id) THEN
    RAISE EXCEPTION 'User already belongs to a tenant';
  END IF;

  -- 2.5 Ensure data is valid to prevent empty inserts
  IF length(trim(p_tenant_name)) < 2 THEN
    RAISE EXCEPTION 'Tenant name must be at least 2 characters';
  END IF;
  
  IF length(trim(p_first_name)) < 1 OR length(trim(p_last_name)) < 1 THEN
    RAISE EXCEPTION 'First and last names are required';
  END IF;

  -- 3. Generate a reasonably unique slug
  -- Replaces non-alphanumeric characters with hyphens, lowercases, and appends a tiny random string
  v_slug := lower(regexp_replace(p_tenant_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || floor(random() * 10000)::text;

  -- 4. Insert the new Tenant
  INSERT INTO public.tenants (name, slug)
  VALUES (p_tenant_name, v_slug)
  RETURNING id INTO v_tenant_id;

  -- 5. Create their Profile linked to this new Tenant
  INSERT INTO public.profiles (id, tenant_id, first_name, last_name, email)
  VALUES (
    v_user_id,
    v_tenant_id,
    p_first_name,
    p_last_name,
    v_email
  );

  -- 6. Retrieve the Admin role ID
  SELECT id INTO v_role_id FROM public.roles WHERE name = 'admin';

  IF v_role_id IS NULL THEN
    RAISE EXCEPTION 'Admin role does not exist in the database';
  END IF;

  -- 7. Assign them Admin privileges for this Tenant
  INSERT INTO public.user_roles (user_id, role_id)
  VALUES (v_user_id, v_role_id);

  RETURN v_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
