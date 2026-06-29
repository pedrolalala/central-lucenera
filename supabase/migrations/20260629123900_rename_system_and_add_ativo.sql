-- 1. Rename "Fichas Técnicas Ubiqua" to "Fichas Técnicas"
UPDATE public.systems SET name = 'Fichas Técnicas' WHERE name = 'Fichas Técnicas Ubiqua';

-- 2. Add ativo column to usuarios table for toggle functionality
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true;

-- 3. Fix seed user password to Skip@Pass
UPDATE auth.users
SET encrypted_password = crypt('Skip@Pass', gen_salt('bf'))
WHERE email = 'pedro@lucenera.com.br';

-- 4. Reaffirm RLS: usuarios - admin can SELECT and UPDATE all rows
DROP POLICY IF EXISTS "admin_all_usuarios" ON public.usuarios;
CREATE POLICY "admin_all_usuarios" ON public.usuarios
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "authenticated_select_self" ON public.usuarios;
CREATE POLICY "authenticated_select_self" ON public.usuarios
    FOR SELECT TO authenticated USING (auth.uid() = id);

-- 5. Reaffirm RLS: logs_auditoria - admin can SELECT all records
DROP POLICY IF EXISTS "admin_all_logs" ON public.logs_auditoria;
CREATE POLICY "admin_all_logs" ON public.logs_auditoria
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "user_insert_logs" ON public.logs_auditoria;
CREATE POLICY "user_insert_logs" ON public.logs_auditoria
    FOR INSERT TO authenticated
    WITH CHECK (usuario_id = auth.uid());

-- 6. Reaffirm RLS: user_system_access - admin can INSERT and DELETE
DROP POLICY IF EXISTS "admin_all_usa" ON public.user_system_access;
CREATE POLICY "admin_all_usa" ON public.user_system_access
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "user_select_usa" ON public.user_system_access;
CREATE POLICY "user_select_usa" ON public.user_system_access
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());
