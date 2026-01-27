import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useMemo, useState } from 'react';

const weeklyData = [
  { day: 'Mon', sales: 900 },
  { day: 'Tue', sales: 1200 },
  { day: 'Wed', sales: 800 },
  { day: 'Thu', sales: 1500 },
  { day: 'Fri', sales: 1100 },
  { day: 'Sat', sales: 1700 },
  { day: 'Sun', sales: 1300 },
];

const monthlyData = [
  { month: 'Jan', sales: 4000 },
  { month: 'Feb', sales: 3000 },
  { month: 'Mar', sales: 5000 },
  { month: 'Apr', sales: 4500 },
  { month: 'May', sales: 6000 },
  { month: 'Jun', sales: 5500 },
  { month: 'Jul', sales: 7000 },
];

const quarterlyData = [
  { quarter: 'Q1', sales: 12000 },
  { quarter: 'Q2', sales: 16000 },
  { quarter: 'Q3', sales: 15500 },
  { quarter: 'Q4', sales: 18000 },
];

const yearlyData = [
  { year: '2021', sales: 52000 },
  { year: '2022', sales: 61000 },
  { year: '2023', sales: 68000 },
  { year: '2024', sales: 73500 },
  { year: '2025', sales: 70200 },
];

const SalesOverviewChart = () => {
  const [selectTimeRange, setSelectTimeRange] = useState('month');

  const { data, xKey, label } = useMemo(() => {
    switch (selectTimeRange) {
      case 'week':
        return { data: weeklyData, xKey: 'day', label: 'This Week' };
      case 'quarter':
        return { data: quarterlyData, xKey: 'quarter', label: 'This Quarter' };
      case 'year':
        return { data: yearlyData, xKey: 'year', label: 'This Year' };
      case 'month':
      default:
        return { data: monthlyData, xKey: 'month', label: 'This Month' };
    }
  }, [selectTimeRange]);

  return (
    <motion.div
      className="bg-gray-800 bg-opacity-50 backdrop-blur-md shadow-lg rounded-xl p-6 border border-gray-700 mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-100">Sales Overview — {label}</h2>

        <select
          className="bg-gray-700 text-white rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={selectTimeRange}
          onChange={(e) => setSelectTimeRange(e.target.value)}
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
          <option value="year">This Year</option>
        </select>
      </div>

      <div className="w-full h-80">
        <ResponsiveContainer>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey={xKey} stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(31, 41, 55, 0.8)',
                borderColor: '#4b5563',
              }}
            />
            <Area
              type="monotone"
              dataKey="sales"
              stroke="#885CF6"
              fill="#885CF6"
              fillOpacity={0.3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default SalesOverviewChart;
