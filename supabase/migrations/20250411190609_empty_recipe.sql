/*
  # Create admin configuration table

  1. New Tables
    - `admin_config`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `created_at` (timestamp)
  2. Security
    - Enable RLS on `admin_config` table
    - Add policy for authenticated users to read admin config
  3. Initial Data
    - Add mokszywai@gmail.com as admin
*/

CREATE TABLE IF NOT EXISTS admin_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_config ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'admin_config' 
    AND policyname = 'Anyone can read admin config'
  ) THEN
    CREATE POLICY "Anyone can read admin config"
      ON admin_config
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Insert the admin email
INSERT INTO admin_config (email)
VALUES ('mokszywai@gmail.com')
ON CONFLICT (email) DO NOTHING;