-- Adiciona e preenche categorias dos produtos existentes.
-- Execute no SQL Editor do Supabase se a coluna product_type ainda não estiver configurada.

CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA extensions;

ALTER TABLE flashcard_products
ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'lanches';

ALTER TABLE flashcard_products
DROP CONSTRAINT IF EXISTS flashcard_products_product_type_check;

UPDATE flashcard_products
SET product_type = CASE
  WHEN lower(extensions.unaccent(name)) ~ '(fandangos|doritos|cheetos|cebolitos|batata)' THEN 'salgadinhos'
  WHEN lower(extensions.unaccent(name)) ~ '(coca|fanta|kuat|sprite|antarctica|tonica|agua|cajuina|suco|jarra|iogurte|toddynho|monster|red bull|power bull|megaton|guaraton|del valle|cafe|leite|coco|golito)' THEN 'bebidas'
  WHEN lower(extensions.unaccent(name)) ~ '(pf|cuscus|arroz|bife|frango|costela|bode|sopa|caldo|macaxeira|porcao|feijao|macarrao|carne moida|mocoto|sol)' THEN 'refeicoes'
  ELSE 'lanches'
END,
updated_at = NOW();

ALTER TABLE flashcard_products
ALTER COLUMN product_type SET DEFAULT 'lanches';

ALTER TABLE flashcard_products
ALTER COLUMN product_type SET NOT NULL;

ALTER TABLE flashcard_products
ADD CONSTRAINT flashcard_products_product_type_check
CHECK (product_type IN ('lanches', 'refeicoes', 'bebidas', 'salgadinhos'));
