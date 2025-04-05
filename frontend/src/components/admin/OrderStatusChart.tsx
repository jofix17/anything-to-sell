import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ChartData {
  status: string;
  count: number;
}

interface OrderStatusChartProps {
  data: ChartData[];
}

const OrderStatusChart: React.FC<OrderStatusChartProps> = ({ data }) => {
  // Define colors for each status
  const COLORS = {
    Pending: '#FBBF24', // yellow
    Processing: '#3B82F6', // blue
    Shipped: '#8B5CF6', // purple
    Delivered: '#10B981', // green
    Cancelled: '#EF4444', // red
  };

  // Calculate total orders
  const totalOrders = data.reduce((sum, item) => sum + item.count, 0);

  // Process data for pie chart
  const chartData = data.map((item) => ({
    name: item.status,
    value: item.count,
    color: COLORS[item.status as keyof typeof COLORS] || '#9CA3AF', // gray as default
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white shadow-md rounded-md p-2 border border-gray-200">
          <p className="text-sm font-medium">{`${data.name}: ${data.value}`}</p>
          <p className="text-xs text-gray-500">{`(${((data.value / totalOrders) * 100).toFixed(1)}%)`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Total Orders: {totalOrders}</h3>
      </div>
      
      <div className="flex flex-col md:flex-row">
        <div className="md:w-1/2 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                labelLine={false}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="md:w-1/2 flex flex-col justify-center">
          <div className="grid grid-cols-1 gap-2">
            {chartData.map((status) => (
              <div key={status.name} className="flex items-center">
                <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: status.color }} />
                <div className="flex-1 flex items-center justify-between">
                  <span className="text-sm text-gray-700">{status.name}</span>
                  <span className="text-sm font-medium text-gray-900">
                    {status.value} ({((status.value / totalOrders) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderStatusChart;
