-- 1. Rename "Cadastro Lucenera" to "Consultar Produtos"
UPDATE public.systems
SET name = 'Consultar Produtos'
WHERE name = 'Cadastro Lucenera';

-- 2. Reaffirm "Fichas Técnicas Ubiqua" → "Fichas Técnicas"
UPDATE public.systems
SET name = 'Fichas Técnicas'
WHERE name = 'Fichas Técnicas Ubiqua';

-- 3. Enable RLS on systems table if not already enabled
ALTER TABLE public.systems ENABLE ROW LEVEL SECURITY;

-- 4. RLS policy: authenticated users can SELECT from systems
DROP POLICY IF EXISTS "authenticated_select_systems" ON public.systems;
CREATE POLICY "authenticated_select_systems" ON public.systems
    FOR SELECT TO authenticated USING (true);

-- 5. RLS policy: admin can manage all systems
DROP POLICY IF EXISTS "admin_all_systems" ON public.systems;
CREATE POLICY "admin_all_systems" ON public.systems
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 6. Reaffirm RLS on usuarios: admin can SELECT, INSERT, UPDATE, DELETE
DROP POLICY IF EXISTS "admin_all_usuarios" ON public.usuarios;
CREATE POLICY "admin_all_usuarios" ON public.usuarios
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "authenticated_select_self" ON public.usuarios;
CREATE POLICY "authenticated_select_self" ON public.usuarios
    FOR SELECT TO authenticated USING (auth.uid() = id);

-- 7. Ensure pedro@lucenera.com.br has password Skip@Pass and admin role
UPDATE auth.users
SET encrypted_password = crypt('Skip@Pass', gen_salt('bf')),
    confirmation_token = '',
    recovery_token = '',
    email_change_token_new = '',
    email_change = '',
    email_change_token_current = '',
    phone_change = '',
    phone_change_token = '',
    reauthentication_token = '',
    phone = NULL
WHERE email = 'pedro@lucenera.com.br';

UPDATE public.usuarios
SET role = 'admin'::public.usuario_role,
    ativo = true
WHERE email = 'pedro@lucenera.com.br';
