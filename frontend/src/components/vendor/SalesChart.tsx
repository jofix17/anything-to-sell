import React, { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ChartData {
  month: string;
  revenue: number;
  orders: number;
}

interface SalesChartProps {
  data: ChartData[];
}

const SalesChart: React.FC<SalesChartProps> = ({ data }) => {
  const [chartType, setChartType] = useState<'revenue' | 'orders' | 'both'>('both');
  const [chartStyle, setChartStyle] = useState<'line' | 'bar'>('line');

  // Calculate totals
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const totalOrders = data.reduce((sum, item) => sum + item.orders, 0);

  // Format tooltip values
  const formatTooltipRevenue = (value: number) => `${value.toLocaleString()}`;
  const formatTooltipOrders = (value: number) => `${value} orders`;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between mb-4">
        <div className="flex space-x-4 mb-2 sm:mb-0">
          <button
            onClick={() => setChartType('both')}
            className={`px-3 py-1 text-sm font-medium rounded-md ${
              chartType === 'both'
                ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Revenue & Orders
          </button>
          <button
            onClick={() => setChartType('revenue')}
            className={`px-3 py-1 text-sm font-medium rounded-md ${
              chartType === 'revenue'
                ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Revenue Only
          </button>
          <button
            onClick={() => setChartType('orders')}
            className={`px-3 py-1 text-sm font-medium rounded-md ${
              chartType === 'orders'
                ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Orders Only
          </button>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setChartStyle('line')}
            className={`p-1 rounded ${
              chartStyle === 'line' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="Line Chart"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          </button>
          <button
            onClick={() => setChartStyle('bar')}
            className={`p-1 rounded ${
              chartStyle === 'bar' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="Bar Chart"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="mt-1 grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-blue-700 font-medium">Total Revenue</p>
          <p className="text-2xl font-bold text-gray-900">${totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-sm text-green-700 font-medium">Total Orders</p>
          <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
        </div>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {chartStyle === 'line' ? (
            <LineChart
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis 
                yAxisId="left" 
                orientation="left" 
                stroke="#4F46E5" 
                tickFormatter={(value) => `${value}`}
                hide={chartType === 'orders'} 
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                stroke="#10B981"
                hide={chartType === 'revenue'} 
              />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'Revenue') return formatTooltipRevenue(value as number);
                  return formatTooltipOrders(value as number);
                }}
              />
              <Legend />
              {(chartType === 'both' || chartType === 'revenue') && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#4F46E5"
                  activeDot={{ r: 8 }}
                  strokeWidth={2}
                />
              )}
              {(chartType === 'both' || chartType === 'orders') && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="orders"
                  name="Orders"
                  stroke="#10B981"
                  strokeWidth={2}
                />
              )}
            </LineChart>
          ) : (
            <BarChart
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis 
                yAxisId="left" 
                orientation="left" 
                stroke="#4F46E5" 
                tickFormatter={(value) => `${value}`}
                hide={chartType === 'orders'} 
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                stroke="#10B981"
                hide={chartType === 'revenue'} 
              />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'Revenue') return formatTooltipRevenue(value as number);
                  return formatTooltipOrders(value as number);
                }}
              />
              <Legend />
              {(chartType === 'both' || chartType === 'revenue') && (
                <Bar
                  yAxisId="left"
                  dataKey="revenue"
                  name="Revenue"
                  fill="#4F46E5"
                />
              )}
              {(chartType === 'both' || chartType === 'orders') && (
                <Bar
                  yAxisId="right"
                  dataKey="orders"
                  name="Orders"
                  fill="#10B981"
                />
              )}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SalesChart;
