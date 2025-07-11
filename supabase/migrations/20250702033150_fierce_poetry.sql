/*
  # Add INSERT and UPDATE policies for asset management

  1. Policy Updates
    - Add INSERT policy for `ativos_config` table to allow adding new assets
    - Add UPDATE policy for `ativos_config` table to allow updating asset configurations
    - Update the dynamic table creation in CSVUploader to include INSERT and UPDATE policies

  2. Security
    - Maintain RLS on all tables
    - Allow public access for INSERT and UPDATE operations on asset data
    - Ensure consistent policy naming across all asset tables

  3. Changes
    - Add policies to `ativos_config` table for data management operations
    - The dynamic asset table policies will be handled in the application code
*/

-- Add INSERT policy for ativos_config table
CREATE POLICY "Inserção pública dos ativos"
  ON ativos_config
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Add UPDATE policy for ativos_config table  
CREATE POLICY "Atualização pública dos ativos"
  ON ativos_config
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);