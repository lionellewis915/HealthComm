'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { supabase, Patient, MedicalProfessional } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { VitalCard } from '@/components/vital-card';
import { VitalsChart } from '@/components/vitals-chart';
import { Activity, Heart, Droplet, Thermometer, Wind, LogOut, Users } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { generateRandomVitals, generateHistoricalData, VitalSignsData } from '@/lib/vital-signs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function DoctorDashboard() {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();
  const [doctorData, setDoctorData] = useState<MedicalProfessional | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [currentVitals, setCurrentVitals] = useState<VitalSignsData>(generateRandomVitals());
  const [historicalData, setHistoricalData] = useState<VitalSignsData[]>(generateHistoricalData(24));

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (profile && profile.role !== 'medical_professional') {
      router.push('/');
    } else if (user) {
      loadDoctorData();
    }
  }, [user, profile, loading, router]);

  useEffect(() => {
    if (!selectedPatient) return;

    const interval = setInterval(() => {
      const newVitals = generateRandomVitals();
      setCurrentVitals(newVitals);
      setHistoricalData((prev) => [...prev.slice(-23), newVitals]);
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedPatient]);

  const loadDoctorData = async () => {
    if (!user) return;

    try {
      const { data: doctor, error } = await supabase
        .from('medical_professionals')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      setDoctorData(doctor);

      const { data: assignedPatients } = await supabase
        .from('patients')
        .select('*')
        .eq('assigned_doctor_id', user.id)
        .order('created_at', { ascending: false });

      const { data: connectedPatients } = await supabase
        .from('patient_connections')
        .select('patient_id')
        .eq('connected_user_id', user.id)
        .eq('connection_type', 'medical_professional');

      let allPatients = assignedPatients || [];

      if (connectedPatients && connectedPatients.length > 0) {
        const connectedPatientIds = connectedPatients.map((c) => c.patient_id);
        const { data: otherPatients } = await supabase
          .from('patients')
          .select('*')
          .in('id', connectedPatientIds)
          .order('created_at', { ascending: false });

        const assignedIds = allPatients.map((p) => p.id);
        const uniqueOthers = (otherPatients || []).filter((p) => !assignedIds.includes(p.id));
        allPatients = [...allPatients, ...uniqueOthers];
      }

      setPatients(allPatients);
      if (allPatients.length > 0) {
        setSelectedPatient(allPatients[0]);
      }
    } catch (error) {
      console.error('Error loading doctor data:', error);
    }
  };

  const formatChartData = (data: VitalSignsData[], key: keyof VitalSignsData) => {
    return data.map((item) => ({
      time: new Date(item.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      value: item[key] as number,
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-primary text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">HealthComm</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Dr. {doctorData?.first_name} {doctorData?.last_name}
          </h1>
          <p className="text-muted-foreground">{doctorData?.specialization}</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-primary" />
                <span>Total Patients</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{patients.length}</div>
            </CardContent>
          </Card>

          <Card className="border-border lg:col-span-3">
            <CardHeader>
              <CardTitle>Select Patient</CardTitle>
              <CardDescription>View real-time vital signs for your patients</CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedPatient?.id}
                onValueChange={(value) => {
                  const patient = patients.find((p) => p.id === value);
                  setSelectedPatient(patient || null);
                  setHistoricalData(generateHistoricalData(24));
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.first_name} {patient.last_name} - {patient.patient_code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        {selectedPatient ? (
          <>
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold">
                    {selectedPatient.first_name} {selectedPatient.last_name}
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Patient Code: {selectedPatient.patient_code} | Blood Type: {selectedPatient.blood_type}
                    {selectedPatient.allergies && ` | Allergies: ${selectedPatient.allergies}`}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <VitalCard
                  title="Heart Rate"
                  value={currentVitals.heartRate}
                  unit="bpm"
                  icon={Heart}
                  vitalKey="heartRate"
                />
                <VitalCard
                  title="BP Systolic"
                  value={currentVitals.bloodPressureSystolic}
                  unit="mmHg"
                  icon={Activity}
                  vitalKey="bloodPressureSystolic"
                />
                <VitalCard
                  title="BP Diastolic"
                  value={currentVitals.bloodPressureDiastolic}
                  unit="mmHg"
                  icon={Activity}
                  vitalKey="bloodPressureDiastolic"
                />
                <VitalCard
                  title="Blood Oxygen"
                  value={currentVitals.bloodOxygen}
                  unit="%"
                  icon={Wind}
                  vitalKey="bloodOxygen"
                />
                <VitalCard
                  title="Glucose"
                  value={currentVitals.glucoseLevel}
                  unit="mg/dL"
                  icon={Droplet}
                  vitalKey="glucoseLevel"
                />
                <VitalCard
                  title="Temperature"
                  value={currentVitals.temperature}
                  unit="°F"
                  icon={Thermometer}
                  vitalKey="temperature"
                />
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-2xl font-bold">24-Hour Vital Trends</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <VitalsChart
                  title="Heart Rate Trend"
                  data={formatChartData(historicalData, 'heartRate')}
                  color="#ef4444"
                />
                <VitalsChart
                  title="Blood Pressure Trend (Systolic)"
                  data={formatChartData(historicalData, 'bloodPressureSystolic')}
                  color="#3b82f6"
                />
                <VitalsChart
                  title="Blood Oxygen Saturation"
                  data={formatChartData(historicalData, 'bloodOxygen')}
                  color="#10b981"
                />
                <VitalsChart
                  title="Glucose Level Trend"
                  data={formatChartData(historicalData, 'glucoseLevel')}
                  color="#f59e0b"
                />
              </div>
            </div>
          </>
        ) : (
          <Card className="border-border">
            <CardContent className="py-12 text-center">
              <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No patients assigned yet</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
