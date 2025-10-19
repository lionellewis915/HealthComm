/*
  # Add Patient Files and Caregiver Connection Features

  1. New Tables
    - `patient_files` - Stores uploaded files for patients
    - `data_deletion_requests` - Manages data deletion requests
    
  2. Changes
    - Add `primary_caregiver_id` column to `patients` table
    
  3. Security
    - Enable RLS on all new tables
    - Policies for doctors, patients, and caretakers
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patients' AND column_name = 'primary_caregiver_id'
  ) THEN
    ALTER TABLE patients ADD COLUMN primary_caregiver_id uuid REFERENCES caretakers(id);
  END IF;
END $$;

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

DROP POLICY IF EXISTS "Patients can view own files" ON patient_files;
CREATE POLICY "Patients can view own files"
  ON patient_files FOR SELECT
  TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Doctors can view patient files" ON patient_files;
CREATE POLICY "Doctors can view patient files"
  ON patient_files FOR SELECT
  TO authenticated
  USING (
    patient_id IN (
      SELECT p.id FROM patients p
      WHERE p.assigned_doctor_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Doctors can upload patient files" ON patient_files;
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

DROP POLICY IF EXISTS "Doctors can delete own uploads" ON patient_files;
CREATE POLICY "Doctors can delete own uploads"
  ON patient_files FOR DELETE
  TO authenticated
  USING (uploaded_by = auth.uid());

DROP POLICY IF EXISTS "Caretakers can view connected patient files" ON patient_files;
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

DROP POLICY IF EXISTS "Patients can create deletion requests" ON data_deletion_requests;
CREATE POLICY "Patients can create deletion requests"
  ON data_deletion_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    patient_id = auth.uid()
  );

DROP POLICY IF EXISTS "Patients can view own deletion requests" ON data_deletion_requests;
CREATE POLICY "Patients can view own deletion requests"
  ON data_deletion_requests FOR SELECT
  TO authenticated
  USING (patient_id = auth.uid());

DROP POLICY IF EXISTS "Doctors can view patient deletion requests" ON data_deletion_requests;
CREATE POLICY "Doctors can view patient deletion requests"
  ON data_deletion_requests FOR SELECT
  TO authenticated
  USING (
    patient_id IN (
      SELECT p.id FROM patients p
      WHERE p.assigned_doctor_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Doctors can update deletion requests" ON data_deletion_requests;
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

CREATE INDEX IF NOT EXISTS idx_patient_files_patient_id ON patient_files(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_files_uploaded_by ON patient_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_patient_id ON data_deletion_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_status ON data_deletion_requests(status);
CREATE INDEX IF NOT EXISTS idx_patients_primary_caregiver ON patients(primary_caregiver_id);
