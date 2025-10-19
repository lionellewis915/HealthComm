'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useTheme } from '@/lib/theme-provider';

interface VitalsChartProps {
  title: string;
  data: Array<{
    time: string;
    value: number;
  }>;
  dataKey?: string;
  color?: string;
  domain?: [number, number];
}

export function VitalsChart({ title, data, dataKey = 'value', color = '#22c55e', domain }: VitalsChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const calculateDomain = (): [number, number] | undefined => {
    if (domain) return domain;

    if (data.length === 0) return undefined;

    const values = data.map(d => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue;
    const padding = Math.max(range * 0.3, 5);

    return [
      Math.floor(minValue - padding),
      Math.ceil(maxValue + padding)
    ];
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#333' : '#e0e0e0'} />
            <XAxis
              dataKey="time"
              stroke={isDark ? '#888' : '#666'}
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke={isDark ? '#888' : '#666'}
              style={{ fontSize: '12px' }}
              domain={calculateDomain()}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
                border: `1px solid ${isDark ? '#333' : '#e0e0e0'}`,
                borderRadius: '4px',
                color: isDark ? '#fff' : '#000',
              }}
            />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              fill={`url(#gradient-${title})`}
              dot={{ fill: color, r: 3 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
