'use client';

import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  type TooltipProps,
} from 'recharts';
import { format, parseISO } from 'date-fns';

interface RevenueDataPoint {
  date: string;
  revenue: number;
  sales: number;
}

interface RevenueChartProps {
  data: RevenueDataPoint[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;

  let formattedDate = String(label);
  try {
    formattedDate = format(parseISO(String(label)), 'MMM dd, yyyy');
  } catch {
    // keep raw label
  }

  return (
    <div className="bg-surface-200/90 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-2xl shadow-black/50">
      <p className="text-xs text-white/50 font-medium mb-2">{formattedDate}</p>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-400" />
          <span className="text-sm text-white/70">Revenue:</span>
          <span className="text-sm font-semibold text-white">
            Rs. {payload[0]?.value?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
        {payload[1] && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-violet-400" />
            <span className="text-sm text-white/70">Sales:</span>
            <span className="text-sm font-semibold text-white">
              {payload[1].value}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function formatYAxis(value: number): string {
  if (value >= 1000) return `Rs. ${(value / 1000).toFixed(1)}k`;
  return `Rs. ${value}`;
}

function formatXAxis(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'MMM dd');
  } catch {
    return dateStr;
  }
}

export default function RevenueChart({ data }: RevenueChartProps) {
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const totalSales = data.reduce((sum, d) => sum + d.sales, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="
        relative overflow-hidden rounded-2xl
        bg-white/[0.03] backdrop-blur-xl
        border border-white/[0.06]
        p-6
      "
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Revenue Trend</h3>
          <p className="text-sm text-white/40 mt-0.5">Last 30 days performance</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-xs text-white/40 uppercase tracking-wider">Total Revenue</p>
            <p className="text-xl font-bold text-white">
              Rs. {totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/40 uppercase tracking-wider">Total Sales</p>
            <p className="text-xl font-bold text-white">{totalSales.toLocaleString()}</p>
          </div>
          <div className="p-2 rounded-lg bg-indigo-500/10">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[320px] -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366F1" stopOpacity={0.3} />
                <stop offset="50%" stopColor="#8B5CF6" stopOpacity={0.1} />
                <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="revenueStroke" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#6366F1" />
                <stop offset="50%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#A78BFA" />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxis}
              tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
              tickLine={false}
              interval={4}
              dy={8}
            />
            <YAxis
              tickFormatter={formatYAxis}
              tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              dx={-4}
              width={55}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(99,102,241,0.2)', strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="url(#revenueStroke)"
              strokeWidth={2.5}
              fill="url(#revenueGradient)"
              dot={false}
              activeDot={{
                r: 5,
                fill: '#6366F1',
                stroke: '#fff',
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
