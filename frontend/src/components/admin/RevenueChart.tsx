import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ChartData {
  month: string;
  revenue: number;
}

interface RevenueChartProps {
  data: ChartData[];
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
  const [viewType, setViewType] = useState<'all' | 'q1' | 'q2' | 'q3' | 'q4'>('all');

  // Filter data based on viewType
  const getFilteredData = () => {
    if (viewType === 'all') return data;
    
    const quarterMonths = {
      q1: ['Jan', 'Feb', 'Mar'],
      q2: ['Apr', 'May', 'Jun'],
      q3: ['Jul', 'Aug', 'Sep'],
      q4: ['Oct', 'Nov', 'Dec'],
    };
    
    return data.filter(item => quarterMonths[viewType].includes(item.month));
  };

  const filteredData = getFilteredData();
  
  // Calculate total revenue
  const totalRevenue = filteredData.reduce((sum, item) => sum + item.revenue, 0);
  
  // Format tooltip values
  const formatTooltipValue = (value: number) => `$${value.toLocaleString()}`;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">${totalRevenue.toLocaleString()}</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setViewType('all')}
            className={`px-3 py-1 text-xs font-medium rounded-md ${
              viewType === 'all'
                ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setViewType('q1')}
            className={`px-3 py-1 text-xs font-medium rounded-md ${
              viewType === 'q1'
                ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Q1
          </button>
          <button
            onClick={() => setViewType('q2')}
            className={`px-3 py-1 text-xs font-medium rounded-md ${
              viewType === 'q2'
                ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Q2
          </button>
          <button
            onClick={() => setViewType('q3')}
            className={`px-3 py-1 text-xs font-medium rounded-md ${
              viewType === 'q3'
                ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Q3
          </button>
          <button
            onClick={() => setViewType('q4')}
            className={`px-3 py-1 text-xs font-medium rounded-md ${
              viewType === 'q4'
                ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Q4
          </button>
        </div>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={filteredData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
            <Tooltip formatter={formatTooltipValue} />
            <Bar dataKey="revenue" name="Revenue" fill="#4F46E5" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueChart;
