'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { supabase, Patient, Caretaker } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VitalCard } from '@/components/vital-card';
import { VitalsChart } from '@/components/vitals-chart';
import { Activity, Heart, Droplet, Thermometer, Wind, LogOut, UserPlus, Users } from 'lucide-react';
import { generateRandomVitals, generateHistoricalData, VitalSignsData } from '@/lib/vital-signs';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function CaretakerDashboard() {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [caretakerData, setCaretakerData] = useState<Caretaker | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [currentVitals, setCurrentVitals] = useState<VitalSignsData>(generateRandomVitals());
  const [historicalData, setHistoricalData] = useState<VitalSignsData[]>(generateHistoricalData(24));
  const [patientCode, setPatientCode] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (profile && profile.role !== 'caretaker') {
      router.push('/');
    } else if (user) {
      loadCaretakerData();
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

  const loadCaretakerData = async () => {
    if (!user) return;

    try {
      const { data: caretaker, error } = await supabase
        .from('caretakers')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      setCaretakerData(caretaker);

      const { data: connections } = await supabase
        .from('patient_connections')
        .select('patient_id')
        .eq('connected_user_id', user.id)
        .eq('connection_type', 'caretaker');

      if (connections && connections.length > 0) {
        const patientIds = connections.map((c) => c.patient_id);
        const { data: connectedPatients } = await supabase
          .from('patients')
          .select('*')
          .in('id', patientIds)
          .order('created_at', { ascending: false });

        setPatients(connectedPatients || []);
        if (connectedPatients && connectedPatients.length > 0) {
          setSelectedPatient(connectedPatients[0]);
        }
      }
    } catch (error) {
      console.error('Error loading caretaker data:', error);
    }
  };

  const connectToPatient = async () => {
    if (!patientCode.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a patient code',
        variant: 'destructive',
      });
      return;
    }

    setConnecting(true);
    try {
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('patient_code', patientCode.trim().toUpperCase())
        .maybeSingle();

      if (patientError || !patient) {
        toast({
          title: 'Error',
          description: 'Patient not found. Please check the code and try again.',
          variant: 'destructive',
        });
        return;
      }

      const { error: connectionError } = await supabase.from('patient_connections').insert({
        patient_id: patient.id,
        connected_user_id: user!.id,
        connection_type: 'caretaker',
      });

      if (connectionError) {
        if (connectionError.code === '23505') {
          toast({
            title: 'Already Connected',
            description: 'You are already connected to this patient',
            variant: 'destructive',
          });
        } else {
          throw connectionError;
        }
        return;
      }

      toast({
        title: 'Success',
        description: `Connected to ${patient.first_name} ${patient.last_name}`,
      });

      setPatientCode('');
      setDialogOpen(false);
      loadCaretakerData();
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-primary text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">HealthComm</span>
          </div>
          <Button variant="outline" size="sm" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome, {caretakerData?.first_name} {caretakerData?.last_name}
          </h1>
          <p className="text-muted-foreground">Monitor your loved ones' health vitals</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-primary" />
                <span>Connected Patients</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary mb-4">{patients.length}</div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Patient
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Connect to Patient</DialogTitle>
                    <DialogDescription>
                      Enter the 8-character patient code to connect and monitor their vitals
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="patientCode">Patient Code</Label>
                      <Input
                        id="patientCode"
                        placeholder="e.g., ABC12345"
                        value={patientCode}
                        onChange={(e) => setPatientCode(e.target.value.toUpperCase())}
                        maxLength={8}
                      />
                    </div>
                    <Button
                      onClick={connectToPatient}
                      disabled={connecting || !patientCode.trim()}
                      className="w-full"
                    >
                      {connecting ? 'Connecting...' : 'Connect to Patient'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          <Card className="border-border lg:col-span-3">
            <CardHeader>
              <CardTitle>Select Patient</CardTitle>
              <CardDescription>View real-time vital signs for connected patients</CardDescription>
            </CardHeader>
            <CardContent>
              {patients.length > 0 ? (
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
              ) : (
                <p className="text-muted-foreground text-sm">
                  No patients connected. Click "Add Patient" to get started.
                </p>
              )}
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
              <p className="text-muted-foreground mb-4">No patients connected</p>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Connect to Your First Patient
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Connect to Patient</DialogTitle>
                    <DialogDescription>
                      Enter the 8-character patient code to connect and monitor their vitals
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="patientCode">Patient Code</Label>
                      <Input
                        id="patientCode"
                        placeholder="e.g., ABC12345"
                        value={patientCode}
                        onChange={(e) => setPatientCode(e.target.value.toUpperCase())}
                        maxLength={8}
                      />
                    </div>
                    <Button
                      onClick={connectToPatient}
                      disabled={connecting || !patientCode.trim()}
                      className="w-full"
                    >
                      {connecting ? 'Connecting...' : 'Connect to Patient'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
