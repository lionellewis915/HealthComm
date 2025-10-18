/*
  # HealthComm Database Schema

  ## Overview
  This migration creates the complete database structure for the HealthComm health monitoring platform,
  supporting three user types: medical professionals, patients, and caretakers.

  ## New Tables
  
  ### 1. `user_profiles`
  - `id` (uuid, primary key) - References auth.users
  - `email` (text) - User email
  - `role` (text) - User role: 'medical_professional', 'patient', 'caretaker'
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `medical_professionals`
  - `id` (uuid, primary key) - References user_profiles
  - `first_name` (text) - First name
  - `last_name` (text) - Last name
  - `gender` (text) - Gender
  - `date_of_birth` (date) - Date of birth
  - `profession` (text) - Medical profession
  - `specialization` (text) - Area of specialization
  - `license_number` (text) - Medical license number
  - `license_authority` (text) - Licensing authority
  - `qualification` (text) - Educational qualifications
  - `years_of_experience` (integer) - Years of experience
  - `phone_number` (text) - Contact phone number
  - `is_available_for_assignment` (boolean) - Available for auto-assignment
  - `created_at` (timestamptz)

  ### 3. `patients`
  - `id` (uuid, primary key) - References user_profiles
  - `first_name` (text) - First name
  - `last_name` (text) - Last name
  - `gender` (text) - Gender
  - `date_of_birth` (date) - Date of birth
  - `phone_number` (text) - Contact phone number
  - `next_of_kin` (text) - Emergency contact
  - `blood_type` (text) - Blood type
  - `allergies` (text) - Known allergies
  - `patient_code` (text, unique) - Unique 8-character code for connections
  - `assigned_doctor_id` (uuid) - References medical_professionals
  - `created_at` (timestamptz)

  ### 4. `caretakers`
  - `id` (uuid, primary key) - References user_profiles
  - `first_name` (text) - First name
  - `last_name` (text) - Last name
  - `phone_number` (text) - Contact phone number
  - `created_at` (timestamptz)

  ### 5. `patient_connections`
  - `id` (uuid, primary key)
  - `patient_id` (uuid) - References patients
  - `connected_user_id` (uuid) - References user_profiles (caretaker or doctor)
  - `connection_type` (text) - 'caretaker' or 'medical_professional'
  - `created_at` (timestamptz)

  ### 6. `vital_signs`
  - `id` (uuid, primary key)
  - `patient_id` (uuid) - References patients
  - `heart_rate` (integer) - Heart rate (bpm)
  - `blood_pressure_systolic` (integer) - Systolic BP
  - `blood_pressure_diastolic` (integer) - Diastolic BP
  - `blood_oxygen` (decimal) - Blood oxygen saturation (%)
  - `glucose_level` (decimal) - Blood glucose (mg/dL)
  - `temperature` (decimal) - Body temperature (°F)
  - `recorded_at` (timestamptz) - When vitals were recorded
  - `created_at` (timestamptz)

  ## Security
  - Enable Row Level Security (RLS) on all tables
  - Medical professionals can view their assigned patients' data
  - Patients can view their own data and connected users
  - Caretakers can view connected patients' data
  - Users can only update their own profiles
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('medical_professional', 'patient', 'caretaker')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create medical_professionals table
CREATE TABLE IF NOT EXISTS medical_professionals (
  id uuid PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  gender text NOT NULL,
  date_of_birth date NOT NULL,
  profession text NOT NULL,
  specialization text NOT NULL,
  license_number text NOT NULL,
  license_authority text NOT NULL,
  qualification text NOT NULL,
  years_of_experience integer NOT NULL,
  phone_number text NOT NULL,
  is_available_for_assignment boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create patients table
CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  gender text NOT NULL,
  date_of_birth date NOT NULL,
  phone_number text NOT NULL,
  next_of_kin text NOT NULL,
  blood_type text NOT NULL,
  allergies text DEFAULT '',
  patient_code text UNIQUE NOT NULL,
  assigned_doctor_id uuid REFERENCES medical_professionals(id),
  created_at timestamptz DEFAULT now()
);

-- Create caretakers table
CREATE TABLE IF NOT EXISTS caretakers (
  id uuid PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone_number text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create patient_connections table
CREATE TABLE IF NOT EXISTS patient_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  connected_user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  connection_type text NOT NULL CHECK (connection_type IN ('caretaker', 'medical_professional')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(patient_id, connected_user_id)
);

-- Create vital_signs table
CREATE TABLE IF NOT EXISTS vital_signs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  heart_rate integer,
  blood_pressure_systolic integer,
  blood_pressure_diastolic integer,
  blood_oxygen decimal(5,2),
  glucose_level decimal(5,1),
  temperature decimal(4,1),
  recorded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_patients_code ON patients(patient_code);
CREATE INDEX IF NOT EXISTS idx_patient_connections_patient ON patient_connections(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_connections_connected ON patient_connections(connected_user_id);
CREATE INDEX IF NOT EXISTS idx_vital_signs_patient ON vital_signs(patient_id);
CREATE INDEX IF NOT EXISTS idx_vital_signs_recorded ON vital_signs(recorded_at DESC);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE caretakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE vital_signs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for medical_professionals
CREATE POLICY "Medical professionals can view their own profile"
  ON medical_professionals FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Anyone can view available doctors for assignment"
  ON medical_professionals FOR SELECT
  TO authenticated
  USING (is_available_for_assignment = true);

CREATE POLICY "Medical professionals can insert their own profile"
  ON medical_professionals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Medical professionals can update their own profile"
  ON medical_professionals FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for patients
CREATE POLICY "Patients can view their own profile"
  ON patients FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Connected users can view patient profiles"
  ON patients FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patient_connections
      WHERE patient_connections.patient_id = patients.id
      AND patient_connections.connected_user_id = auth.uid()
    )
  );

CREATE POLICY "Assigned doctors can view their patients"
  ON patients FOR SELECT
  TO authenticated
  USING (assigned_doctor_id = auth.uid());

CREATE POLICY "Patients can insert their own profile"
  ON patients FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Patients can update their own profile"
  ON patients FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for caretakers
CREATE POLICY "Caretakers can view their own profile"
  ON caretakers FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Caretakers can insert their own profile"
  ON caretakers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Caretakers can update their own profile"
  ON caretakers FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for patient_connections
CREATE POLICY "Patients can view their connections"
  ON patient_connections FOR SELECT
  TO authenticated
  USING (patient_id = auth.uid() OR connected_user_id = auth.uid());

CREATE POLICY "Patients can create connections"
  ON patient_connections FOR INSERT
  TO authenticated
  WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Connected users can view connections"
  ON patient_connections FOR SELECT
  TO authenticated
  USING (connected_user_id = auth.uid());

-- RLS Policies for vital_signs
CREATE POLICY "Patients can view their own vital signs"
  ON vital_signs FOR SELECT
  TO authenticated
  USING (patient_id = auth.uid());

CREATE POLICY "Connected users can view patient vital signs"
  ON vital_signs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patient_connections
      WHERE patient_connections.patient_id = vital_signs.patient_id
      AND patient_connections.connected_user_id = auth.uid()
    )
  );

CREATE POLICY "Assigned doctors can view patient vital signs"
  ON vital_signs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = vital_signs.patient_id
      AND patients.assigned_doctor_id = auth.uid()
    )
  );

CREATE POLICY "System can insert vital signs"
  ON vital_signs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to generate unique patient code
CREATE OR REPLACE FUNCTION generate_patient_code()
RETURNS text AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;