-- 1. Rename "Dashboard RH Lucenera" → "RH Lucenera"
UPDATE public.systems
SET name = 'RH Lucenera'
WHERE name = 'Dashboard RH Lucenera';

-- 2. Reaffirm "Fichas Técnicas Ubiqua" → "Fichas Técnicas"
UPDATE public.systems
SET name = 'Fichas Técnicas'
WHERE name = 'Fichas Técnicas Ubiqua';

-- 3. Reaffirm "Cadastro Lucenera" → "Consultar Produtos"
UPDATE public.systems
SET name = 'Consultar Produtos'
WHERE name = 'Cadastro Lucenera';
