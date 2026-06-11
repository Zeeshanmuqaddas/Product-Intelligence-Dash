import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export interface PriceDataPoint {
  date: string;
  price: number;
  isForecast?: boolean;
}

interface PriceTrendChartProps {
  data: PriceDataPoint[];
  savedAlert?: number;
}

export const PriceTrendChart: React.FC<PriceTrendChartProps> = ({ data, savedAlert }) => {
  return (
    <ResponsiveContainer width="100%" height={120}>
      <LineChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
        <XAxis dataKey="date" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} minTickGap={20} />
        <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} domain={['dataMin - 20', 'dataMax + 20']} />
        <Tooltip 
          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px', padding: '4px 8px' }}
          itemStyle={{ color: '#fff' }}
          labelStyle={{ display: 'none' }}
          formatter={(value: number, name: string, props: any) => [`$${value}`, props.payload.isForecast ? 'Predicted Price' : 'Current Price']}
        />
        {savedAlert && (
            <ReferenceLine y={savedAlert} stroke="#10b981" strokeDasharray="3 3" />
        )}
        <Line 
          type="monotone" 
          dataKey="price"
          stroke="#ec4899" 
          strokeWidth={2} 
          strokeDasharray="4 4"
          dot={false}
          activeDot={{ r: 4, fill: '#ec4899' }} 
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
