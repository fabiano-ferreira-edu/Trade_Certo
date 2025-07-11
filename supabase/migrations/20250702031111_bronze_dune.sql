/*
  # Create stock data tables

  1. New Tables
    - `ativo_petr4`
      - `data` (date, primary key)
      - `abertura` (numeric)
      - `maxima` (numeric) 
      - `minima` (numeric)
      - `fechamento` (numeric)
      - `volume` (numeric)
      - `created_at` (timestamp)
    - `ativo_vale3` (same structure as above)

  2. Security
    - Enable RLS on both tables
    - Add policies for public read access (if they don't exist)

  3. Sample Data
    - Insert initial data to prevent immediate errors
*/

-- Create PETR4 stock data table
CREATE TABLE IF NOT EXISTS ativo_petr4 (
  data date PRIMARY KEY,
  abertura numeric NOT NULL,
  maxima numeric NOT NULL,
  minima numeric NOT NULL,
  fechamento numeric NOT NULL,
  volume numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create VALE3 stock data table
CREATE TABLE IF NOT EXISTS ativo_vale3 (
  data date PRIMARY KEY,
  abertura numeric NOT NULL,
  maxima numeric NOT NULL,
  minima numeric NOT NULL,
  fechamento numeric NOT NULL,
  volume numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE ativo_petr4 ENABLE ROW LEVEL SECURITY;
ALTER TABLE ativo_vale3 ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (handle existing policies)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ativo_petr4' 
    AND policyname = 'Leitura pública PETR4'
  ) THEN
    CREATE POLICY "Leitura pública PETR4"
      ON ativo_petr4
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ativo_vale3' 
    AND policyname = 'Leitura pública VALE3'
  ) THEN
    CREATE POLICY "Leitura pública VALE3"
      ON ativo_vale3
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END $$;

-- Add some sample data to prevent immediate errors
INSERT INTO ativo_petr4 (data, abertura, maxima, minima, fechamento, volume) VALUES
  ('2024-01-02', 40.50, 41.20, 40.10, 40.85, 45000000),
  ('2024-01-03', 40.85, 41.50, 40.60, 41.25, 42000000),
  ('2024-01-04', 41.25, 41.80, 40.95, 41.15, 38000000),
  ('2024-01-05', 41.15, 41.60, 40.80, 41.45, 41000000)
ON CONFLICT (data) DO NOTHING;

INSERT INTO ativo_vale3 (data, abertura, maxima, minima, fechamento, volume) VALUES
  ('2024-01-02', 70.25, 71.50, 69.80, 70.95, 35000000),
  ('2024-01-03', 70.95, 72.10, 70.40, 71.65, 32000000),
  ('2024-01-04', 71.65, 72.30, 71.20, 71.85, 29000000),
  ('2024-01-05', 71.85, 72.50, 71.30, 72.15, 33000000)
ON CONFLICT (data) DO NOTHING;