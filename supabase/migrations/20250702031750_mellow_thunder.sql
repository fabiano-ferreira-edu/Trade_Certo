/*
  # Create exec_sql function for dynamic table creation

  1. New Functions
    - `exec_sql` function to execute dynamic SQL statements
    - Allows creating tables dynamically from the frontend

  2. Security
    - Function is accessible to authenticated users
    - Enables dynamic table creation for CSV uploads
*/

CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;