-- Clean the table to insert the fresh data correctly
TRUNCATE TABLE public.systems;

INSERT INTO public.systems (id, name, description, link, icon_name, display_order)
VALUES 
  (gen_random_uuid(), 'Administração Bancária', 'Gerencia boletos, duplicatas, retorno CNAB 400 e remessa Bradesco.', 'https://retorno-bancario-bradesco-5392a.goskip.app/', 'Landmark', 1),
  (gen_random_uuid(), 'Cadastro Lucenera', 'Registro de clientes, peças técnicas e novos projetos.', 'https://cadastro-lucenera-b86fe.goskip.app/', 'FileText', 2),
  (gen_random_uuid(), 'CRM Lucenera', 'Histórico e acompanhamento de cada cliente.', 'https://lucenera-crm-3bd29.goskip.app/?v=1460a3e', 'Users', 3),
  (gen_random_uuid(), 'Orçamentos Lucenera', 'Fluxo de aprovação de itens de orçamento.', 'https://gestaofinanceiralucenera.goskip.app/budgets', 'Calculator', 4),
  (gen_random_uuid(), 'Sistema de Entregas', 'Controle logístico de entregas.', 'https://lucenera.lovable.app/separacao', 'Truck', 5),
  (gen_random_uuid(), 'Fichas Técnicas Ubiqua', 'Catálogo de peças técnicas da marca representada.', 'https://sistema.apilucenera.site', 'Library', 6),
  (gen_random_uuid(), 'Dashboard RH Lucenera', 'Gestão de pessoas, remunerações e dados de colaboradores.', 'https://dashboard-rh-lucenera-5fe9c.goskip.app/?v=930e4f5', 'Briefcase', 7);
