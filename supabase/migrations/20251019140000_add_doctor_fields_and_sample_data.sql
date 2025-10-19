/*
  # Add Doctor Fields and Sample Jamaican Doctors

  ## Changes
  1. Add email field to medical_professionals table
  2. Add hospital field to medical_professionals table
  3. Insert sample Jamaican doctors with realistic data

  ## Sample Data
  - Creates 10 sample doctors from various Jamaican hospitals
  - All doctors are set as available for assignment
  - Includes realistic Jamaican names, specializations, and hospital affiliations
*/

-- Add email field to medical_professionals if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'medical_professionals' AND column_name = 'email'
  ) THEN
    ALTER TABLE medical_professionals ADD COLUMN email text;
  END IF;
END $$;

-- Add hospital field to medical_professionals if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'medical_professionals' AND column_name = 'hospital'
  ) THEN
    ALTER TABLE medical_professionals ADD COLUMN hospital text NOT NULL DEFAULT 'Unknown Hospital';
  END IF;
END $$;

-- Create sample Jamaican doctors
-- Note: These are inserted with dummy user_profile entries for demonstration
-- In production, these would be created through the signup process

-- Insert sample user profiles for doctors
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES
  ('d1111111-1111-1111-1111-111111111111'::uuid, 'dr.thompson@uhwi.edu.jm', crypt('password123', gen_salt('bf')), now(), now(), now()),
  ('d2222222-2222-2222-2222-222222222222'::uuid, 'dr.williams@kph.gov.jm', crypt('password123', gen_salt('bf')), now(), now(), now()),
  ('d3333333-3333-3333-3333-333333333333'::uuid, 'dr.brown@mandeville.gov.jm', crypt('password123', gen_salt('bf')), now(), now(), now()),
  ('d4444444-4444-4444-4444-444444444444'::uuid, 'dr.reid@uhwi.edu.jm', crypt('password123', gen_salt('bf')), now(), now(), now()),
  ('d5555555-5555-5555-5555-555555555555'::uuid, 'dr.francis@annotto.gov.jm', crypt('password123', gen_salt('bf')), now(), now(), now()),
  ('d6666666-6666-6666-6666-666666666666'::uuid, 'dr.clarke@kph.gov.jm', crypt('password123', gen_salt('bf')), now(), now(), now()),
  ('d7777777-7777-7777-7777-777777777777'::uuid, 'dr.campbell@cornwall.gov.jm', crypt('password123', gen_salt('bf')), now(), now(), now()),
  ('d8888888-8888-8888-8888-888888888888'::uuid, 'dr.gordon@spanish.gov.jm', crypt('password123', gen_salt('bf')), now(), now(), now()),
  ('d9999999-9999-9999-9999-999999999999'::uuid, 'dr.henry@bustamante.gov.jm', crypt('password123', gen_salt('bf')), now(), now(), now()),
  ('daaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'dr.dixon@uhwi.edu.jm', crypt('password123', gen_salt('bf')), now(), now(), now())
ON CONFLICT (id) DO NOTHING;

-- Insert user profiles
INSERT INTO user_profiles (id, email, role, created_at)
VALUES
  ('d1111111-1111-1111-1111-111111111111'::uuid, 'dr.thompson@uhwi.edu.jm', 'medical_professional', now()),
  ('d2222222-2222-2222-2222-222222222222'::uuid, 'dr.williams@kph.gov.jm', 'medical_professional', now()),
  ('d3333333-3333-3333-3333-333333333333'::uuid, 'dr.brown@mandeville.gov.jm', 'medical_professional', now()),
  ('d4444444-4444-4444-4444-444444444444'::uuid, 'dr.reid@uhwi.edu.jm', 'medical_professional', now()),
  ('d5555555-5555-5555-5555-555555555555'::uuid, 'dr.francis@annotto.gov.jm', 'medical_professional', now()),
  ('d6666666-6666-6666-6666-666666666666'::uuid, 'dr.clarke@kph.gov.jm', 'medical_professional', now()),
  ('d7777777-7777-7777-7777-777777777777'::uuid, 'dr.campbell@cornwall.gov.jm', 'medical_professional', now()),
  ('d8888888-8888-8888-8888-888888888888'::uuid, 'dr.gordon@spanish.gov.jm', 'medical_professional', now()),
  ('d9999999-9999-9999-9999-999999999999'::uuid, 'dr.henry@bustamante.gov.jm', 'medical_professional', now()),
  ('daaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'dr.dixon@uhwi.edu.jm', 'medical_professional', now())
ON CONFLICT (id) DO NOTHING;

-- Insert medical professionals
INSERT INTO medical_professionals (
  id, first_name, last_name, email, gender, date_of_birth, profession, specialization,
  license_number, license_authority, qualification, years_of_experience,
  phone_number, hospital, is_available_for_assignment, created_at
)
VALUES
  (
    'd1111111-1111-1111-1111-111111111111'::uuid,
    'Marcus', 'Thompson', 'dr.thompson@uhwi.edu.jm', 'male', '1975-03-15',
    'Physician', 'Endocrinology',
    'JMC-2001-1847', 'Jamaica Medical Council', 'MBBS, MD',
    23, '876-927-1620', 'University Hospital of the West Indies', true, now()
  ),
  (
    'd2222222-2222-2222-2222-222222222222'::uuid,
    'Shauna', 'Williams', 'dr.williams@kph.gov.jm', 'female', '1980-07-22',
    'Physician', 'Cardiology',
    'JMC-2006-2341', 'Jamaica Medical Council', 'MBBS, MRCP',
    17, '876-922-0210', 'Kingston Public Hospital', true, now()
  ),
  (
    'd3333333-3333-3333-3333-333333333333'::uuid,
    'Trevor', 'Brown', 'dr.brown@mandeville.gov.jm', 'male', '1978-11-08',
    'Physician', 'General Medicine',
    'JMC-2003-1956', 'Jamaica Medical Council', 'MBBS',
    20, '876-962-2067', 'Mandeville Regional Hospital', true, now()
  ),
  (
    'd4444444-4444-4444-4444-444444444444'::uuid,
    'Kimberly', 'Reid', 'dr.reid@uhwi.edu.jm', 'female', '1982-05-30',
    'Physician', 'Internal Medicine',
    'JMC-2008-2789', 'Jamaica Medical Council', 'MBBS, DM',
    15, '876-927-2100', 'University Hospital of the West Indies', true, now()
  ),
  (
    'd5555555-5555-5555-5555-555555555555'::uuid,
    'Andre', 'Francis', 'dr.francis@annotto.gov.jm', 'male', '1985-09-12',
    'Physician', 'Family Medicine',
    'JMC-2011-3245', 'Jamaica Medical Council', 'MBBS',
    12, '876-996-2321', 'Annotto Bay Hospital', true, now()
  ),
  (
    'd6666666-6666-6666-6666-666666666666'::uuid,
    'Nadine', 'Clarke', 'dr.clarke@kph.gov.jm', 'female', '1977-12-19',
    'Physician', 'Nephrology',
    'JMC-2002-1678', 'Jamaica Medical Council', 'MBBS, DM',
    21, '876-922-0340', 'Kingston Public Hospital', true, now()
  ),
  (
    'd7777777-7777-7777-7777-777777777777'::uuid,
    'Richard', 'Campbell', 'dr.campbell@cornwall.gov.jm', 'male', '1981-04-25',
    'Physician', 'Emergency Medicine',
    'JMC-2007-2567', 'Jamaica Medical Council', 'MBBS',
    16, '876-952-5100', 'Cornwall Regional Hospital', true, now()
  ),
  (
    'd8888888-8888-8888-8888-888888888888'::uuid,
    'Michelle', 'Gordon', 'dr.gordon@spanish.gov.jm', 'female', '1983-08-03',
    'Physician', 'Pediatrics',
    'JMC-2009-2934', 'Jamaica Medical Council', 'MBBS, DCH',
    14, '876-984-2446', 'Spanish Town Hospital', true, now()
  ),
  (
    'd9999999-9999-9999-9999-999999999999'::uuid,
    'Christopher', 'Henry', 'dr.henry@bustamante.gov.jm', 'male', '1979-06-17',
    'Physician', 'Orthopedics',
    'JMC-2004-2134', 'Jamaica Medical Council', 'MBBS, FRCS',
    19, '876-938-2051', 'Bustamante Hospital for Children', true, now()
  ),
  (
    'daaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    'Patricia', 'Dixon', 'dr.dixon@uhwi.edu.jm', 'female', '1984-02-28',
    'Physician', 'Gastroenterology',
    'JMC-2010-3089', 'Jamaica Medical Council', 'MBBS, MRCP',
    13, '876-927-1790', 'University Hospital of the West Indies', true, now()
  )
ON CONFLICT (id) DO NOTHING;
