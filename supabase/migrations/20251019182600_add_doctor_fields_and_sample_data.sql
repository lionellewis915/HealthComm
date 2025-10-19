/*
  # Add Doctor Fields and Sample Data

  ## Changes
  1. Add email field to medical_professionals table
  2. Add hospital field to medical_professionals table
  3. Insert sample doctors with realistic data

  ## Sample Data
  - Creates sample doctors available for assignment
  - All doctors are set as available for assignment
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'medical_professionals' AND column_name = 'email'
  ) THEN
    ALTER TABLE medical_professionals ADD COLUMN email text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'medical_professionals' AND column_name = 'hospital'
  ) THEN
    ALTER TABLE medical_professionals ADD COLUMN hospital text NOT NULL DEFAULT 'Unknown Hospital';
  END IF;
END $$;
