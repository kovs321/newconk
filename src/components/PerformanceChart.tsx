import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { month: 'Jan', performance: 100 },
  { month: 'Feb', performance: 118 },
  { month: 'Mar', performance: 125 },
  { month: 'Apr', performance: 142 },
  { month: 'May', performance: 135 },
  { month: 'Jun', performance: 156 },
];

const PerformanceChart = () => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis 
          dataKey="month" 
          stroke="#6B7280"
          style={{ fontSize: '14px' }}
        />
        <YAxis 
          stroke="#6B7280"
          style={{ fontSize: '14px' }}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '6px'
          }}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="performance" 
          stroke="#FFA500" 
          strokeWidth={2}
          dot={{ fill: '#FFA500', r: 4 }}
          activeDot={{ r: 6 }}
          name="Strategy Performance %"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default PerformanceChart;