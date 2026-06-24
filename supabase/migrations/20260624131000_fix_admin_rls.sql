-- 1. Create a security definer function to avoid infinite recursion on public.usuarios policies
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
DECLARE
  v_role public.usuario_role;
BEGIN
  SELECT role INTO v_role FROM public.usuarios WHERE id = auth.uid();
  RETURN v_role = 'admin'::public.usuario_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update RLS policies to use the new function to avoid infinite recursion

-- For public.usuarios
DROP POLICY IF EXISTS "admin_all_usuarios" ON public.usuarios;
CREATE POLICY "admin_all_usuarios" ON public.usuarios
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- For public.user_system_access
DROP POLICY IF EXISTS "admin_all_usa" ON public.user_system_access;
CREATE POLICY "admin_all_usa" ON public.user_system_access
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- For public.logs_auditoria
DROP POLICY IF EXISTS "admin_all_logs" ON public.logs_auditoria;
CREATE POLICY "admin_all_logs" ON public.logs_auditoria
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 3. Ensure pedro@lucenera.com.br is fully seeded and has admin role securely
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Check if user exists in auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'pedro@lucenera.com.br' LIMIT 1;
  
  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'pedro@lucenera.com.br',
      crypt('Skip@Pass123!', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Pedro"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL,
      '', '', ''
    );
  END IF;

  -- Ensure user is in public.usuarios and is an admin
  INSERT INTO public.usuarios (id, email, nome, role)
  VALUES (v_user_id, 'pedro@lucenera.com.br', 'Pedro', 'admin'::usuario_role)
  ON CONFLICT (id) DO UPDATE 
  SET role = 'admin'::usuario_role;
  
END $$;
