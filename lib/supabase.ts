import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'medical_professional' | 'patient' | 'caretaker';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface MedicalProfessional {
  id: string;
  first_name: string;
  last_name: string;
  gender: string;
  date_of_birth: string;
  profession: string;
  specialization: string;
  license_number: string;
  license_authority: string;
  qualification: string;
  years_of_experience: number;
  phone_number: string;
  is_available_for_assignment: boolean;
  created_at: string;
}

export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  gender: string;
  date_of_birth: string;
  phone_number: string;
  next_of_kin: string;
  blood_type: string;
  allergies: string;
  patient_code: string;
  assigned_doctor_id: string | null;
  created_at: string;
}

export interface Caretaker {
  id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  created_at: string;
}

export interface VitalSigns {
  id: string;
  patient_id: string;
  heart_rate: number | null;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  blood_oxygen: number | null;
  glucose_level: number | null;
  temperature: number | null;
  recorded_at: string;
  created_at: string;
}
