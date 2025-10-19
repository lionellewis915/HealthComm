/*
  # Add Patient Files and Caregiver Connection Features

  1. New Tables
    - `patient_files`
      - `id` (uuid, primary key)
      - `patient_id` (uuid, references patients)
      - `uploaded_by` (uuid, references auth.users)
      - `file_name` (text)
      - `file_type` (text)
      - `file_url` (text)
      - `file_size` (integer)
      - `description` (text, optional)
      - `created_at` (timestamptz)
    
    - `data_deletion_requests`
      - `id` (uuid, primary key)
      - `patient_id` (uuid, references patients)
      - `status` (text) - 'pending', 'approved', 'completed', 'rejected'
      - `reason` (text, optional)
      - `requested_at` (timestamptz)
      - `processed_at` (timestamptz, optional)
      - `processed_by` (uuid, optional)

  2. Changes
    - Add `primary_caregiver_id` column to `patients` table to link patients with their primary caregiver
    
  3. Security
    - Enable RLS on `patient_files` table
    - Policies for doctors to upload and view files for their patients
    - Policies for patients to view their own files
    - Policies for caretakers to view files of connected patients
    - Enable RLS on `data_deletion_requests` table
    - Policies for patients to create and view their own requests
    - Policies for admins/doctors to view and process requests
*/

-- Add primary_caregiver_id to patients table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patients' AND column_name = 'primary_caregiver_id'
  ) THEN
    ALTER TABLE patients ADD COLUMN primary_caregiver_id uuid REFERENCES caretakers(id);
  END IF;
END $$;

-- Create patient_files table
CREATE TABLE IF NOT EXISTS patient_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  uploaded_by uuid REFERENCES auth.users(id) NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_url text NOT NULL,
  file_size integer DEFAULT 0,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE patient_files ENABLE ROW LEVEL SECURITY;

-- Patients can view their own files
CREATE POLICY "Patients can view own files"
  ON patient_files FOR SELECT
  TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE id = auth.uid()
    )
  );

-- Doctors can view files for their patients
CREATE POLICY "Doctors can view patient files"
  ON patient_files FOR SELECT
  TO authenticated
  USING (
    patient_id IN (
      SELECT p.id FROM patients p
      WHERE p.assigned_doctor_id = auth.uid()
    )
  );

-- Doctors can upload files for their patients
CREATE POLICY "Doctors can upload patient files"
  ON patient_files FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid() AND
    patient_id IN (
      SELECT p.id FROM patients p
      WHERE p.assigned_doctor_id = auth.uid()
    )
  );

-- Doctors can delete files they uploaded
CREATE POLICY "Doctors can delete own uploads"
  ON patient_files FOR DELETE
  TO authenticated
  USING (uploaded_by = auth.uid());

-- Caretakers can view files for connected patients
CREATE POLICY "Caretakers can view connected patient files"
  ON patient_files FOR SELECT
  TO authenticated
  USING (
    patient_id IN (
      SELECT pc.patient_id FROM patient_connections pc
      WHERE pc.connected_user_id = auth.uid()
      AND pc.connection_type = 'caretaker'
    )
    OR
    patient_id IN (
      SELECT p.id FROM patients p
      WHERE p.primary_caregiver_id = auth.uid()
    )
  );

-- Create data_deletion_requests table
CREATE TABLE IF NOT EXISTS data_deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'completed', 'rejected')),
  reason text,
  requested_at timestamptz DEFAULT now() NOT NULL,
  processed_at timestamptz,
  processed_by uuid REFERENCES auth.users(id)
);

ALTER TABLE data_deletion_requests ENABLE ROW LEVEL SECURITY;

-- Patients can create deletion requests
CREATE POLICY "Patients can create deletion requests"
  ON data_deletion_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    patient_id = auth.uid()
  );

-- Patients can view their own deletion requests
CREATE POLICY "Patients can view own deletion requests"
  ON data_deletion_requests FOR SELECT
  TO authenticated
  USING (patient_id = auth.uid());

-- Doctors can view deletion requests for their patients
CREATE POLICY "Doctors can view patient deletion requests"
  ON data_deletion_requests FOR SELECT
  TO authenticated
  USING (
    patient_id IN (
      SELECT p.id FROM patients p
      WHERE p.assigned_doctor_id = auth.uid()
    )
  );

-- Doctors can update deletion request status
CREATE POLICY "Doctors can update deletion requests"
  ON data_deletion_requests FOR UPDATE
  TO authenticated
  USING (
    patient_id IN (
      SELECT p.id FROM patients p
      WHERE p.assigned_doctor_id = auth.uid()
    )
  )
  WITH CHECK (
    patient_id IN (
      SELECT p.id FROM patients p
      WHERE p.assigned_doctor_id = auth.uid()
    )
  );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_patient_files_patient_id ON patient_files(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_files_uploaded_by ON patient_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_patient_id ON data_deletion_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_status ON data_deletion_requests(status);
CREATE INDEX IF NOT EXISTS idx_patients_primary_caregiver ON patients(primary_caregiver_id);