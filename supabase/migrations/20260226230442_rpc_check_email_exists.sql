-- Function to verify if an email exists across the system securely
CREATE OR REPLACE FUNCTION public.check_email_exists(p_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  -- Introduce a random delay (0.2s - 0.7s) to thwart rapid enumeration and timing attacks
  PERFORM pg_sleep(random() * 0.5 + 0.2);

  -- Search in auth.users directly (SECURITY DEFINER allows this bypass)
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE email = p_email
  ) INTO v_exists;
  
  RETURN v_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
