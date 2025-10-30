-- Script para corrigir a tabela se ela já foi criada com UNIQUE no code
-- Execute este script ANTES de executar o supabase.sql novamente

-- Remover a constraint UNIQUE do campo code se existir
DO $$ 
BEGIN
    -- Tentar remover a constraint (pode falhar se não existir, mas não importa)
    ALTER TABLE flashcard_products DROP CONSTRAINT IF EXISTS flashcard_products_code_key;
EXCEPTION 
    WHEN others THEN 
        -- Ignorar erro se a constraint não existir
        NULL;
END $$;

-- Limpar a tabela para reinserir os dados corretamente
TRUNCATE TABLE flashcard_products;

