import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { isVitalNormal, getStatusColor, VitalSignsData } from '@/lib/vital-signs';

interface VitalCardProps {
  title: string;
  value: number | string;
  unit: string;
  icon: LucideIcon;
  vitalKey?: keyof VitalSignsData;
}

export function VitalCard({ title, value, unit, icon: Icon, vitalKey }: VitalCardProps) {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  const status = vitalKey ? isVitalNormal(vitalKey as keyof VitalSignsData, numValue) : 'normal';
  const colorClass = getStatusColor(status);

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${colorClass}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${colorClass}`}>
          {value}
          <span className="text-sm ml-1">{unit}</span>
        </div>
      </CardContent>
    </Card>
  );
}
