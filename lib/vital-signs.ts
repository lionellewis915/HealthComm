export interface VitalSignsData {
  heartRate: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  bloodOxygen: number;
  glucoseLevel: number;
  temperature: number;
  timestamp: Date;
  hasSpike?: boolean;
  spikeType?: keyof Omit<VitalSignsData, 'timestamp' | 'hasSpike' | 'spikeType'>;
}

let baseVitals: VitalSignsData | null = null;
let spikeCountdown = 0;
let activeSpikeVital: keyof Omit<VitalSignsData, 'timestamp' | 'hasSpike' | 'spikeType'> | null = null;

function initializeBaseVitals(): VitalSignsData {
  return {
    heartRate: 72,
    bloodPressureSystolic: 120,
    bloodPressureDiastolic: 80,
    bloodOxygen: 98.0,
    glucoseLevel: 95,
    temperature: 98.6,
    timestamp: new Date(),
  };
}

export function generateRandomVitals(): VitalSignsData {
  if (!baseVitals) {
    baseVitals = initializeBaseVitals();
  }

  const shouldSpike = Math.random() < 0.03;

  if (shouldSpike && spikeCountdown === 0) {
    const vitalKeys: Array<keyof Omit<VitalSignsData, 'timestamp' | 'hasSpike' | 'spikeType'>> = [
      'heartRate',
      'bloodPressureSystolic',
      'bloodPressureDiastolic',
      'bloodOxygen',
      'glucoseLevel',
      'temperature',
    ];
    activeSpikeVital = vitalKeys[Math.floor(Math.random() * vitalKeys.length)];
    spikeCountdown = 3;
  }

  const variance = {
    heartRate: 2,
    bloodPressureSystolic: 3,
    bloodPressureDiastolic: 2,
    bloodOxygen: 0.3,
    glucoseLevel: 3,
    temperature: 0.2,
  };

  const newVitals: VitalSignsData = {
    heartRate: baseVitals.heartRate + (Math.random() - 0.5) * variance.heartRate * 2,
    bloodPressureSystolic: baseVitals.bloodPressureSystolic + (Math.random() - 0.5) * variance.bloodPressureSystolic * 2,
    bloodPressureDiastolic: baseVitals.bloodPressureDiastolic + (Math.random() - 0.5) * variance.bloodPressureDiastolic * 2,
    bloodOxygen: baseVitals.bloodOxygen + (Math.random() - 0.5) * variance.bloodOxygen * 2,
    glucoseLevel: baseVitals.glucoseLevel + (Math.random() - 0.5) * variance.glucoseLevel * 2,
    temperature: baseVitals.temperature + (Math.random() - 0.5) * variance.temperature * 2,
    timestamp: new Date(),
  };

  if (spikeCountdown > 0 && activeSpikeVital) {
    const spikeIntensity = spikeCountdown === 3 ? 1.5 : spikeCountdown === 2 ? 1.0 : 0.5;

    switch (activeSpikeVital) {
      case 'heartRate':
        newVitals.heartRate += 35 * spikeIntensity;
        break;
      case 'bloodPressureSystolic':
        newVitals.bloodPressureSystolic += 25 * spikeIntensity;
        break;
      case 'bloodPressureDiastolic':
        newVitals.bloodPressureDiastolic += 15 * spikeIntensity;
        break;
      case 'bloodOxygen':
        newVitals.bloodOxygen -= 5 * spikeIntensity;
        break;
      case 'glucoseLevel':
        newVitals.glucoseLevel += 60 * spikeIntensity;
        break;
      case 'temperature':
        newVitals.temperature += 2.0 * spikeIntensity;
        break;
    }

    if (spikeCountdown === 3) {
      newVitals.hasSpike = true;
      newVitals.spikeType = activeSpikeVital;
    }

    spikeCountdown--;

    if (spikeCountdown === 0) {
      activeSpikeVital = null;
    }
  }

  baseVitals.heartRate = Math.max(65, Math.min(85, baseVitals.heartRate + (Math.random() - 0.5) * 0.5));
  baseVitals.bloodPressureSystolic = Math.max(115, Math.min(125, baseVitals.bloodPressureSystolic + (Math.random() - 0.5) * 0.5));
  baseVitals.bloodPressureDiastolic = Math.max(75, Math.min(85, baseVitals.bloodPressureDiastolic + (Math.random() - 0.5) * 0.3));
  baseVitals.bloodOxygen = Math.max(97, Math.min(99, baseVitals.bloodOxygen + (Math.random() - 0.5) * 0.1));
  baseVitals.glucoseLevel = Math.max(90, Math.min(105, baseVitals.glucoseLevel + (Math.random() - 0.5) * 1));
  baseVitals.temperature = Math.max(98.2, Math.min(98.8, baseVitals.temperature + (Math.random() - 0.5) * 0.1));

  newVitals.heartRate = Math.round(newVitals.heartRate);
  newVitals.bloodPressureSystolic = Math.round(newVitals.bloodPressureSystolic);
  newVitals.bloodPressureDiastolic = Math.round(newVitals.bloodPressureDiastolic);
  newVitals.bloodOxygen = parseFloat(newVitals.bloodOxygen.toFixed(1));
  newVitals.glucoseLevel = parseFloat(newVitals.glucoseLevel.toFixed(1));
  newVitals.temperature = parseFloat(newVitals.temperature.toFixed(1));

  return newVitals;
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

export function getVitalName(vital: keyof Omit<VitalSignsData, 'timestamp' | 'hasSpike' | 'spikeType'>): string {
  switch (vital) {
    case 'heartRate':
      return 'Heart Rate';
    case 'bloodPressureSystolic':
      return 'Blood Pressure (Systolic)';
    case 'bloodPressureDiastolic':
      return 'Blood Pressure (Diastolic)';
    case 'bloodOxygen':
      return 'Blood Oxygen';
    case 'glucoseLevel':
      return 'Glucose Level';
    case 'temperature':
      return 'Temperature';
    default:
      return vital;
  }
}

export function generateHistoricalData(hours: number = 24): VitalSignsData[] {
  const data: VitalSignsData[] = [];
  const now = new Date();
  const tempBase = initializeBaseVitals();

  for (let i = hours; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);

    const variance = {
      heartRate: 3,
      bloodPressureSystolic: 4,
      bloodPressureDiastolic: 3,
      bloodOxygen: 0.4,
      glucoseLevel: 5,
      temperature: 0.3,
    };

    data.push({
      heartRate: Math.round(tempBase.heartRate + (Math.random() - 0.5) * variance.heartRate * 2),
      bloodPressureSystolic: Math.round(tempBase.bloodPressureSystolic + (Math.random() - 0.5) * variance.bloodPressureSystolic * 2),
      bloodPressureDiastolic: Math.round(tempBase.bloodPressureDiastolic + (Math.random() - 0.5) * variance.bloodPressureDiastolic * 2),
      bloodOxygen: parseFloat((tempBase.bloodOxygen + (Math.random() - 0.5) * variance.bloodOxygen * 2).toFixed(1)),
      glucoseLevel: parseFloat((tempBase.glucoseLevel + (Math.random() - 0.5) * variance.glucoseLevel * 2).toFixed(1)),
      temperature: parseFloat((tempBase.temperature + (Math.random() - 0.5) * variance.temperature * 2).toFixed(1)),
      timestamp,
    });
  }

  return data;
}
