import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const data = [
  { name: 'BONK', value: 25, color: '#FF8C00' },
  { name: 'Hosico', value: 25, color: '#FF7F00' },
  { name: 'USELESS', value: 25, color: '#FFA500' },
  { name: 'IKUN', value: 25, color: '#FF6347' },
];

const TokenDistributionChart = () => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${percent != null ? (percent * 100).toFixed(0) : 0}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          style={{ fontSize: '12px', fill: '#f97316' }}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '8px',
            color: '#f97316'
          }}
        />
        <Legend 
          wrapperStyle={{
            color: '#f97316',
            fontSize: '14px'
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default TokenDistributionChart;