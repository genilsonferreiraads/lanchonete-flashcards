-- Políticas de segurança para permitir INSERT apenas para usuários autenticados

-- Remover política de INSERT se existir
DROP POLICY IF EXISTS "Allow authenticated insert" ON flashcard_products;

-- Criar política para permitir INSERT apenas para usuários autenticados
CREATE POLICY "Allow authenticated insert" ON flashcard_products
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Atualizar política de UPDATE (opcional - se quiser permitir edição também)
DROP POLICY IF EXISTS "Allow authenticated update" ON flashcard_products;

CREATE POLICY "Allow authenticated update" ON flashcard_products
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Política de DELETE (opcional)
DROP POLICY IF EXISTS "Allow authenticated delete" ON flashcard_products;

CREATE POLICY "Allow authenticated delete" ON flashcard_products
  FOR DELETE
  USING (auth.role() = 'authenticated');

