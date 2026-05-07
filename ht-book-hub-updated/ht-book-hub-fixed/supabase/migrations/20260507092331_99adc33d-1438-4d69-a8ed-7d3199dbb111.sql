
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;

CREATE POLICY "first admin self-promote"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND role = 'admin'::public.app_role
  AND NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin'::public.app_role)
);
