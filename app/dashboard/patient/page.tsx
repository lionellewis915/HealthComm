'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { supabase, Patient, MedicalProfessional, Caretaker } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VitalCard } from '@/components/vital-card';
import { VitalsChart } from '@/components/vitals-chart';
import { Activity, Heart, Droplet, Thermometer, Wind, LogOut, Copy, Check, UserPlus } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { generateRandomVitals, generateHistoricalData, VitalSignsData } from '@/lib/vital-signs';
import { useToast } from '@/hooks/use-toast';

export default function PatientDashboard() {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [patientData, setPatientData] = useState<Patient | null>(null);
  const [currentVitals, setCurrentVitals] = useState<VitalSignsData>(generateRandomVitals());
  const [historicalData, setHistoricalData] = useState<VitalSignsData[]>(generateHistoricalData(24));
  const [assignedDoctor, setAssignedDoctor] = useState<MedicalProfessional | null>(null);
  const [connectedCaretakers, setConnectedCaretakers] = useState<Caretaker[]>([]);
  const [copied, setCopied] = useState(false);
  const [caretakerCode, setCaretakerCode] = useState('');
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (profile && profile.role !== 'patient') {
      router.push('/');
    } else if (user) {
      loadPatientData();
    }
  }, [user, profile, loading, router]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newVitals = generateRandomVitals();
      setCurrentVitals(newVitals);
      setHistoricalData((prev) => [...prev.slice(-23), newVitals]);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const loadPatientData = async () => {
    if (!user) return;

    try {
      const { data: patient, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      setPatientData(patient);

      if (patient?.assigned_doctor_id) {
        const { data: doctor } = await supabase
          .from('medical_professionals')
          .select('*')
          .eq('id', patient.assigned_doctor_id)
          .maybeSingle();

        setAssignedDoctor(doctor);
      }

      const { data: connections } = await supabase
        .from('patient_connections')
        .select('connected_user_id')
        .eq('patient_id', user.id)
        .eq('connection_type', 'caretaker');

      if (connections && connections.length > 0) {
        const caretakerIds = connections.map((c) => c.connected_user_id);
        const { data: caretakers } = await supabase
          .from('caretakers')
          .select('*')
          .in('id', caretakerIds);

        setConnectedCaretakers(caretakers || []);
      }
    } catch (error) {
      console.error('Error loading patient data:', error);
    }
  };

  const copyPatientCode = () => {
    if (patientData?.patient_code) {
      navigator.clipboard.writeText(patientData.patient_code);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'Patient code copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const connectCaretaker = async () => {
    if (!caretakerCode.trim()) return;

    setConnecting(true);
    try {
      const { data: caretaker, error: caretakerError } = await supabase
        .from('caretakers')
        .select('*')
        .eq('id', caretakerCode.trim())
        .maybeSingle();

      if (caretakerError || !caretaker) {
        toast({
          title: 'Error',
          description: 'Caretaker not found. Please check the code and try again.',
          variant: 'destructive',
        });
        return;
      }

      const { error: connectionError } = await supabase.from('patient_connections').insert({
        patient_id: user!.id,
        connected_user_id: caretaker.id,
        connection_type: 'caretaker',
      });

      if (connectionError) throw connectionError;

      toast({
        title: 'Success',
        description: 'Caretaker connected successfully',
      });

      setCaretakerCode('');
      loadPatientData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setConnecting(false);
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
            Welcome, {patientData?.first_name} {patientData?.last_name}
          </h1>
          <p className="text-muted-foreground">Monitor your health vitals in real-time</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Patient Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Patient Code:</span>
                <div className="flex items-center mt-1">
                  <code className="bg-secondary px-2 py-1 rounded text-primary font-mono">
                    {patientData?.patient_code}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyPatientCode}
                    className="ml-2"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Blood Type:</span>
                <span className="ml-2 font-medium">{patientData?.blood_type}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Date of Birth:</span>
                <span className="ml-2">{patientData?.date_of_birth}</span>
              </div>
              {patientData?.allergies && (
                <div>
                  <span className="text-muted-foreground">Allergies:</span>
                  <span className="ml-2">{patientData.allergies}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle>Assigned Doctor</CardTitle>
            </CardHeader>
            <CardContent>
              {assignedDoctor ? (
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="font-medium text-lg mb-1">
                      Dr. {assignedDoctor.first_name} {assignedDoctor.last_name}
                    </div>
                    <div className="text-muted-foreground">{assignedDoctor.profession}</div>
                  </div>
                  {assignedDoctor.email && (
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <div className="font-medium text-xs break-all">{assignedDoctor.email}</div>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Specialization:</span>
                    <div className="font-medium">{assignedDoctor.specialization}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Qualification:</span>
                    <div className="font-medium">{assignedDoctor.qualification}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Experience:</span>
                    <div className="font-medium">{assignedDoctor.years_of_experience} years</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">License:</span>
                    <div className="font-medium text-xs">{assignedDoctor.license_number}</div>
                  </div>
                  {assignedDoctor.hospital && (
                    <div>
                      <span className="text-muted-foreground">Hospital:</span>
                      <div className="font-medium">{assignedDoctor.hospital}</div>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Phone:</span>
                    <div className="font-medium">{assignedDoctor.phone_number}</div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No doctor assigned</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle>Connected Caretakers</CardTitle>
              <CardDescription>Share your patient code with caretakers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {connectedCaretakers.length > 0 ? (
                <div className="space-y-2">
                  {connectedCaretakers.map((caretaker) => (
                    <div key={caretaker.id} className="text-sm">
                      {caretaker.first_name} {caretaker.last_name}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No caretakers connected</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Current Vital Signs</h2>
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
      </main>
    </div>
  );
}
