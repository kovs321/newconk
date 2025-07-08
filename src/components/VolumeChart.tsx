import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { month: 'Jan', volume: 2400000 },
  { month: 'Feb', volume: 3200000 },
  { month: 'Mar', volume: 2800000 },
  { month: 'Apr', volume: 4100000 },
  { month: 'May', volume: 3600000 },
  { month: 'Jun', volume: 4800000 },
];

const VolumeChart = () => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis 
          dataKey="month" 
          stroke="#6B7280"
          style={{ fontSize: '14px' }}
        />
        <YAxis 
          stroke="#6B7280"
          style={{ fontSize: '14px' }}
          tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '6px'
          }}
          formatter={(value) => [`$${(value / 1000000).toFixed(1)}M`, 'Volume']}
        />
        <Legend />
        <Bar 
          dataKey="volume" 
          fill="#FFA500" 
          name="Trading Volume"
          radius={[2, 2, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default VolumeChart;