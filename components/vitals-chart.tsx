'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '@/lib/theme-provider';

interface VitalsChartProps {
  title: string;
  data: Array<{
    time: string;
    value: number;
  }>;
  dataKey?: string;
  color?: string;
}

export function VitalsChart({ title, data, dataKey = 'value', color = '#0ea5e9' }: VitalsChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#333' : '#e0e0e0'} />
            <XAxis
              dataKey="time"
              stroke={isDark ? '#888' : '#666'}
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke={isDark ? '#888' : '#666'}
              style={{ fontSize: '12px' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
                border: `1px solid ${isDark ? '#333' : '#e0e0e0'}`,
                borderRadius: '4px',
                color: isDark ? '#fff' : '#000',
              }}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              dot={{ fill: color, r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
