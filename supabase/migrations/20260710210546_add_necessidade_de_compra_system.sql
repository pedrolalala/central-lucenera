-- Add "Necessidade de Compra" system to the systems table
-- Idempotent: uses ON CONFLICT on slug to avoid duplicates

INSERT INTO public.systems (id, name, slug, description, link, icon_name, display_order, visivel_no_hub)
VALUES (
  gen_random_uuid(),
  'Necessidade de Compra',
  'necessidade-de-compra',
  'Sistema de gestão de necessidades de compra',
  'https://pagina-em-branco-cdd79.goskip.app/?v=6994721',
  'ClipboardList',
  8,
  true
)
ON CONFLICT (slug) DO NOTHING;
