export interface VitalSignsData {
  heartRate: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  bloodOxygen: number;
  glucoseLevel: number;
  temperature: number;
  timestamp: Date;
}

export function generateRandomVitals(): VitalSignsData {
  return {
    heartRate: Math.floor(60 + Math.random() * 40),
    bloodPressureSystolic: Math.floor(110 + Math.random() * 30),
    bloodPressureDiastolic: Math.floor(70 + Math.random() * 20),
    bloodOxygen: parseFloat((95 + Math.random() * 4).toFixed(1)),
    glucoseLevel: parseFloat((80 + Math.random() * 60).toFixed(1)),
    temperature: parseFloat((97.5 + Math.random() * 2).toFixed(1)),
    timestamp: new Date(),
  };
}

export function isVitalNormal(vital: keyof VitalSignsData, value: number): 'normal' | 'warning' | 'critical' {
  switch (vital) {
    case 'heartRate':
      if (value < 60 || value > 100) return 'critical';
      if (value < 65 || value > 95) return 'warning';
      return 'normal';

    case 'bloodPressureSystolic':
      if (value < 90 || value > 140) return 'critical';
      if (value < 100 || value > 130) return 'warning';
      return 'normal';

    case 'bloodPressureDiastolic':
      if (value < 60 || value > 90) return 'critical';
      if (value < 65 || value > 85) return 'warning';
      return 'normal';

    case 'bloodOxygen':
      if (value < 90) return 'critical';
      if (value < 95) return 'warning';
      return 'normal';

    case 'glucoseLevel':
      if (value < 70 || value > 180) return 'critical';
      if (value < 80 || value > 140) return 'warning';
      return 'normal';

    case 'temperature':
      if (value < 96 || value > 100.4) return 'critical';
      if (value < 97 || value > 99.5) return 'warning';
      return 'normal';

    default:
      return 'normal';
  }
}

export function getStatusColor(status: 'normal' | 'warning' | 'critical'): string {
  switch (status) {
    case 'normal':
      return 'text-green-500';
    case 'warning':
      return 'text-yellow-500';
    case 'critical':
      return 'text-red-500';
  }
}

export function generateHistoricalData(hours: number = 24): VitalSignsData[] {
  const data: VitalSignsData[] = [];
  const now = new Date();

  for (let i = hours; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
    data.push({
      ...generateRandomVitals(),
      timestamp,
    });
  }

  return data;
}
