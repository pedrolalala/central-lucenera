-- 1. Create enum if not exists for user roles
DO $DO$ BEGIN
    CREATE TYPE usuario_role AS ENUM ('admin', 'gerente', 'operador', 'funcionario', 'viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $DO$;

-- 2. Add role column to usuarios table
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS role usuario_role DEFAULT 'viewer';

-- 3. Set pedro@lucenera.com.br as admin (initial seed)
UPDATE public.usuarios SET role = 'admin' WHERE email = 'pedro@lucenera.com.br';

-- 4. Create user_system_access table for granular system access control
CREATE TABLE IF NOT EXISTS public.user_system_access (
    user_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    system_id UUID REFERENCES public.systems(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, system_id)
);

ALTER TABLE public.user_system_access ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for user_system_access
DROP POLICY IF EXISTS "admin_all_usa" ON public.user_system_access;
CREATE POLICY "admin_all_usa" ON public.user_system_access
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND role = 'admin'::usuario_role))
    WITH CHECK (EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND role = 'admin'::usuario_role));

DROP POLICY IF EXISTS "user_select_usa" ON public.user_system_access;
CREATE POLICY "user_select_usa" ON public.user_system_access
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- 6. Ensure RLS on logs_auditoria
ALTER TABLE public.logs_auditoria ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_logs" ON public.logs_auditoria;
CREATE POLICY "admin_all_logs" ON public.logs_auditoria
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND role = 'admin'::usuario_role))
    WITH CHECK (EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND role = 'admin'::usuario_role));

DROP POLICY IF EXISTS "user_insert_logs" ON public.logs_auditoria;
CREATE POLICY "user_insert_logs" ON public.logs_auditoria
    FOR INSERT TO authenticated
    WITH CHECK (usuario_id = auth.uid());

-- 7. Update RLS for public.usuarios to allow admins to manage all users
DROP POLICY IF EXISTS "admin_all_usuarios" ON public.usuarios;
CREATE POLICY "admin_all_usuarios" ON public.usuarios
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND role = 'admin'::usuario_role))
    WITH CHECK (EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND role = 'admin'::usuario_role));

-- Ensure base select policy exists for self
DROP POLICY IF EXISTS "authenticated_select_self" ON public.usuarios;
CREATE POLICY "authenticated_select_self" ON public.usuarios
    FOR SELECT TO authenticated USING (auth.uid() = id);

-- 8. Seed access to all systems for the admin user automatically
DO $DO$
DECLARE
    v_admin_id UUID;
    v_sys RECORD;
BEGIN
    SELECT id INTO v_admin_id FROM auth.users WHERE email = 'pedro@lucenera.com.br' LIMIT 1;
    IF v_admin_id IS NOT NULL THEN
        FOR v_sys IN SELECT id FROM public.systems LOOP
            INSERT INTO public.user_system_access (user_id, system_id)
            VALUES (v_admin_id, v_sys.id)
            ON CONFLICT (user_id, system_id) DO NOTHING;
        END LOOP;
    END IF;
END $DO$;
