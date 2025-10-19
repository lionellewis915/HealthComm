/*
  # Fix Doctor Visibility and Patient Connections

  ## Changes
  1. Allow unauthenticated users to view available doctors during signup
  2. Add policy for caretakers to connect to patients via patient code
  3. Add policies for doctors to view assigned patients details
  4. Add policies for patients to view their assigned doctor details

  ## Security
  - Maintain restrictive RLS while allowing necessary access patterns
  - Doctors can only view patients assigned to them
  - Caretakers can only view patients they're connected to
  - Patients can view their assigned doctor's information
*/

DROP POLICY IF EXISTS "Anyone can view available doctors for assignment" ON medical_professionals;

CREATE POLICY "Anyone can view available doctors for assignment"
  ON medical_professionals FOR SELECT
  TO authenticated, anon
  USING (is_available_for_assignment = true);

DROP POLICY IF EXISTS "Patients can view assigned doctor details" ON medical_professionals;

CREATE POLICY "Patients can view assigned doctor details"
  ON medical_professionals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.assigned_doctor_id = medical_professionals.id
      AND patients.id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Caretakers can create connections via patient code" ON patient_connections;

CREATE POLICY "Caretakers can create connections via patient code"
  ON patient_connections FOR INSERT
  TO authenticated
  WITH CHECK (
    connected_user_id = auth.uid() AND
    connection_type = 'caretaker'
  );

DROP POLICY IF EXISTS "Doctors can view patients they're connected to" ON patients;

CREATE POLICY "Doctors can view patients they're connected to"
  ON patients FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patient_connections
      WHERE patient_connections.patient_id = patients.id
      AND patient_connections.connected_user_id = auth.uid()
      AND patient_connections.connection_type = 'medical_professional'
    )
  );

DROP POLICY IF EXISTS "Allow patient lookup by code for connections" ON patients;

CREATE POLICY "Allow patient lookup by code for connections"
  ON patients FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR
    assigned_doctor_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM patient_connections
      WHERE patient_connections.patient_id = patients.id
      AND patient_connections.connected_user_id = auth.uid()
    )
  );
