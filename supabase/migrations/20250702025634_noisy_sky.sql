/*
# Criar tabelas para análise de ações

1. Novas Tabelas
  - `ativo_PETR4` - Dados históricos da Petrobras
  - `ativo_VALE3` - Dados históricos da Vale
  - `ativos_config` - Configuração de ativos disponíveis

2. Estrutura das Tabelas
  - Cada tabela de ativo tem colunas para dados OHLCV
  - Tabela de configuração para gerenciar ativos

3. Segurança
  - RLS habilitado em todas as tabelas
  - Políticas para leitura pública dos dados
*/

-- Tabela de configuração de ativos
CREATE TABLE IF NOT EXISTS ativos_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text UNIQUE NOT NULL,
  nome text NOT NULL,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Tabela para PETR4
CREATE TABLE IF NOT EXISTS ativo_PETR4 (
  data date PRIMARY KEY,
  abertura numeric NOT NULL,
  maxima numeric NOT NULL,
  minima numeric NOT NULL,
  fechamento numeric NOT NULL,
  volume numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Tabela para VALE3
CREATE TABLE IF NOT EXISTS ativo_VALE3 (
  data date PRIMARY KEY,
  abertura numeric NOT NULL,
  maxima numeric NOT NULL,
  minima numeric NOT NULL,
  fechamento numeric NOT NULL,
  volume numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE ativos_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE ativo_PETR4 ENABLE ROW LEVEL SECURITY;
ALTER TABLE ativo_VALE3 ENABLE ROW LEVEL SECURITY;

-- Políticas para leitura pública
CREATE POLICY "Leitura pública dos ativos"
  ON ativos_config
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Leitura pública PETR4"
  ON ativo_PETR4
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Leitura pública VALE3"
  ON ativo_VALE3
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Inserir dados de configuração inicial
INSERT INTO ativos_config (codigo, nome) VALUES 
  ('PETR4', 'Petrobras PN'),
  ('VALE3', 'Vale ON')
ON CONFLICT (codigo) DO NOTHING;

-- Inserir dados de exemplo para demonstração
INSERT INTO ativo_PETR4 (data, abertura, maxima, minima, fechamento, volume) VALUES 
  ('2024-01-02', 37.50, 38.20, 37.30, 37.80, 45000000),
  ('2024-01-03', 37.80, 38.50, 37.60, 38.10, 42000000),
  ('2024-01-04', 38.10, 38.90, 37.90, 38.40, 48000000),
  ('2024-01-05', 38.40, 39.20, 38.20, 38.90, 51000000)
ON CONFLICT (data) DO NOTHING;

INSERT INTO ativo_VALE3 (data, abertura, maxima, minima, fechamento, volume) VALUES 
  ('2024-01-02', 68.50, 69.80, 68.20, 69.20, 35000000),
  ('2024-01-03', 69.20, 70.50, 69.00, 70.10, 38000000),
  ('2024-01-04', 70.10, 71.20, 69.80, 70.80, 41000000),
  ('2024-01-05', 70.80, 72.00, 70.50, 71.50, 44000000)
ON CONFLICT (data) DO NOTHING;