CREATE OR REPLACE FUNCTION public.get_claims(uid uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = uid;
  RETURN jsonb_build_object('role', user_role);
END;
$$;
