-- ==============================================================================
-- COTA FÁCIL B2B - SCRIPT DE CORREÇÃO SUPABASE: MULTI-FORNECEDORES & SINCRONIZAÇÃO
-- ==============================================================================
-- Execute este script no SQL Editor do Supabase (https://supabase.com/dashboard/project/yidgipbzxsknauvolhre/sql)
--
-- 1. Garante a coluna 'bundle' do tipo JSONB na tabela quotations
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS bundle jsonb;

-- 2. Garante que 'code' tenha índice único para suportar upsert seguro ({ onConflict: 'code' })
CREATE UNIQUE INDEX IF NOT EXISTS idx_quotations_code ON quotations (code);

-- 3. Habilita acesso público anônimo para o fluxo B2B (lojistas e representantes sem auth obrigatória)
ALTER TABLE quotations DISABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_vendors DISABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_products DISABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_prices DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;

-- 4. Permissões explícitas para papéis anon e authenticated
GRANT ALL ON TABLE quotations TO anon, authenticated, service_role;
GRANT ALL ON TABLE quotation_vendors TO anon, authenticated, service_role;
GRANT ALL ON TABLE quotation_products TO anon, authenticated, service_role;
GRANT ALL ON TABLE quotation_prices TO anon, authenticated, service_role;
GRANT ALL ON TABLE orders TO anon, authenticated, service_role;
GRANT ALL ON TABLE stores TO anon, authenticated, service_role;
GRANT ALL ON TABLE invoices TO anon, authenticated, service_role;

-- 5. Habilita Realtime na tabela quotations para sincronização instantânea
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'quotations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE quotations;
  END IF;
END $$;

