-- Enable RLS on systems table and add read policy for authenticated users
ALTER TABLE public.systems ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_select_systems" ON public.systems;
CREATE POLICY "authenticated_select_systems" ON public.systems
  FOR SELECT TO authenticated USING (true);

-- Seed systems
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.systems WHERE name = 'Administração Bancária') THEN
    INSERT INTO public.systems (name, description, link, icon_name, display_order)
    VALUES 
      ('Administração Bancária', 'Gerencia boletos, duplicatas, retorno CNAB 400 e remessa Bradesco.', 'https://retorno-bancario-bradesco-5392a.goskip.app/', 'Landmark', 1),
      ('Cadastro Lucenera', 'Registro de clientes, peças técnicas e novos projetos.', 'https://cadastro-lucenera-b86fe.goskip.app/', 'Users', 2),
      ('CRM Lucenera', 'Histórico e acompanhamento de cada cliente.', 'https://lucenera-crm-3bd29.goskip.app/?v=1460a3e', 'Briefcase', 3),
      ('Orçamentos Lucenera', 'Fluxo de aprovação de itens de orçamento.', 'https://gestaofinanceiralucenera.goskip.app/budgets', 'Calculator', 4),
      ('Sistema de Entregas', 'Controle logístico de entregas.', 'https://lucenera.lovable.app/separacao', 'Truck', 5),
      ('Fichas Técnicas Ubiqua', 'Catálogo de peças técnicas da marca representada.', 'https://sistema.apilucenera.site', 'BookOpen', 6),
      ('Dashboard RH Lucenera', 'Gestão de pessoas, remunerações e dados de colaboradores.', 'https://dashboard-rh-lucenera-5fe9c.goskip.app/?v=930e4f5', 'UserCircle', 7);
  END IF;
END $$;

-- Seed user pedro@lucenera.com.br ensuring idempotent logic
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'pedro@lucenera.com.br') THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'pedro@lucenera.com.br',
      crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Pedro"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL,
      '', '', ''
    );
    
    INSERT INTO public.usuarios (id, email, nome)
    VALUES (new_user_id, 'pedro@lucenera.com.br', 'Pedro')
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;
