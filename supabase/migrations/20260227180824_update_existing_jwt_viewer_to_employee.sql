-- Update existing users whose JWT app_metadata still carries role = 'viewer'
-- so they now reflect the renamed role 'employee'.
UPDATE auth.users
SET raw_app_meta_data =
    raw_app_meta_data || '{"role": "employee"}'::jsonb
WHERE raw_app_meta_data ->> 'role' = 'viewer';
