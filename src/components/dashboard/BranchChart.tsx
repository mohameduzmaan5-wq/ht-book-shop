'use client';

import { motion } from 'framer-motion';
import { GitBranch } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  type TooltipProps,
} from 'recharts';

interface BranchDataPoint {
  name: string;
  revenue: number;
  sales: number;
}

interface BranchChartProps {
  data: BranchDataPoint[];
}

const barColors = [
  { start: '#6366F1', end: '#818CF8' },
  { start: '#8B5CF6', end: '#A78BFA' },
  { start: '#7C3AED', end: '#9F7AEA' },
  { start: '#6D28D9', end: '#8B5CF6' },
  { start: '#5B21B6', end: '#7C3AED' },
];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-surface-200/90 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-2xl shadow-black/50">
      <p className="text-sm font-semibold text-white mb-2">{label}</p>
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

export default function BranchChart({ data }: BranchChartProps) {
  const bestBranch = data.reduce((best, b) => (b.revenue > best.revenue ? b : best), data[0]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
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
          <h3 className="text-lg font-semibold text-white">Branch Performance</h3>
          <p className="text-sm text-white/40 mt-0.5">Revenue comparison this month</p>
        </div>
        <div className="flex items-center gap-3">
          {bestBranch && (
            <div className="text-right">
              <p className="text-xs text-white/40 uppercase tracking-wider">Top Branch</p>
              <p className="text-sm font-semibold text-indigo-400">{bestBranch.name}</p>
            </div>
          )}
          <div className="p-2 rounded-lg bg-violet-500/10">
            <GitBranch className="w-5 h-5 text-violet-400" />
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[320px] -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barCategoryGap="25%">
            <defs>
              {data.map((_, idx) => {
                const colorPair = barColors[idx % barColors.length];
                return (
                  <linearGradient key={`bar-grad-${idx}`} id={`barGrad${idx}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={colorPair.start} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={colorPair.end} stopOpacity={0.5} />
                  </linearGradient>
                );
              })}
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
              tickLine={false}
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
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
            <Bar dataKey="revenue" radius={[8, 8, 0, 0]} maxBarSize={60}>
              {data.map((_, idx) => (
                <Cell key={`cell-${idx}`} fill={`url(#barGrad${idx})`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
