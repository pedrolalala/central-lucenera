-- Update the link for "Necessidade de Compra" system (idempotent UPDATE)
UPDATE public.systems
SET link = 'https://pagina-em-branco-cdd79.goskip.app/?v=6994721'
WHERE slug = 'necessidade-de-compra';

-- Ensure pedro@lucenera.com.br has admin role in usuarios table
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';

UPDATE public.usuarios
SET role = 'admin'
WHERE email = 'pedro@lucenera.com.br';
