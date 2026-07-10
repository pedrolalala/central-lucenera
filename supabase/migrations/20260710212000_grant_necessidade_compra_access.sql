-- Ensure "Necessidade de Compra" system exists (idempotent via conditional insert)
INSERT INTO public.systems (name, slug, description, link, icon_name, display_order, visivel_no_hub)
SELECT 'Necessidade de Compra', 'necessidade-de-compra',
       'Sistema de gestão de necessidades de compra',
       'https://pagina-em-branco-cdd79.goskip.app/?v=6994721',
       'ClipboardList', 8, true
WHERE NOT EXISTS (SELECT 1 FROM public.systems WHERE slug = 'necessidade-de-compra');

-- Grant access to pedro@lucenera.com.br (idempotent)
INSERT INTO public.user_system_access (user_id, system_id)
SELECT u.id, s.id
FROM public.usuarios u
CROSS JOIN public.systems s
WHERE u.email = 'pedro@lucenera.com.br'
  AND s.slug = 'necessidade-de-compra'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_system_access usa
    WHERE usa.user_id = u.id AND usa.system_id = s.id
  );

-- Grant access to all admin users (idempotent)
INSERT INTO public.user_system_access (user_id, system_id)
SELECT u.id, s.id
FROM public.usuarios u
CROSS JOIN public.systems s
WHERE u.role = 'admin'
  AND s.slug = 'necessidade-de-compra'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_system_access usa
    WHERE usa.user_id = u.id AND usa.system_id = s.id
  );

-- RLS: Allow authenticated users to read their own access records
DROP POLICY IF EXISTS "user_select_usa" ON public.user_system_access;
CREATE POLICY "user_select_usa" ON public.user_system_access
    FOR SELECT TO authenticated USING (user_id = auth.uid());

-- RLS: Allow admins to manage all user_system_access records
DROP POLICY IF EXISTS "admin_all_usa" ON public.user_system_access;
CREATE POLICY "admin_all_usa" ON public.user_system_access
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- RLS: Allow users to insert their own access (self-assign)
DROP POLICY IF EXISTS "user_insert_usa" ON public.user_system_access;
CREATE POLICY "user_insert_usa" ON public.user_system_access
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());
