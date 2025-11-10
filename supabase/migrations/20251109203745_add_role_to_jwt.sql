CREATE OR REPLACE FUNCTION public.get_claims(uid uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN jsonb_build_object('role', 'user');
END;
$$;
