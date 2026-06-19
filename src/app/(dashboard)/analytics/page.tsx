'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, TrendingUp, PieChart as PieChartIcon, GitBranch,
  CreditCard, DollarSign, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend,
} from 'recharts';
import { apiClient as db } from '@/lib/apiClient';
import { useAppStore } from '@/store';

// ── Palette ─────────────────────────────────────────
const CHART_COLORS = [
  '#6366F1', '#8B5CF6', '#A78BFA', '#7C3AED', '#4F46E5',
  '#818CF8', '#C4B5FD', '#DDD6FE', '#5B21B6', '#4338CA',
  '#6D28D9', '#EDE9FE',
];

// ── Custom Tooltip ──────────────────────────────────
interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
}

function GlassTooltip({
  active, payload, label,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-4 py-3 shadow-2xl shadow-indigo-500/20 border border-white/10">
      <p className="text-xs text-white/50 mb-1.5">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-medium text-white flex items-center gap-2">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ background: entry.color }}
          />
          {entry.name}: {typeof entry.value === 'number' ? `$${entry.value.toLocaleString()}` : entry.value}
        </p>
      ))}
    </div>
  );
}

// ── Motion wrappers ─────────────────────────────────
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] } },
};

export default function AnalyticsPage() {
  const { selectedBranch } = useAppStore();
  const [range, setRange] = useState<7 | 30 | 90>(30);
  const [stats, setStats] = useState<any>(null);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [expensesData, setExpensesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const [statsRes, salesRes, expensesRes] = await Promise.all([
        db.getDashboardStats(selectedBranch ?? undefined),
        db.getSales(selectedBranch ?? undefined, range),
        db.getExpenses(selectedBranch ?? undefined)
      ]);
      setStats(statsRes);
      setSalesData(salesRes);
      setExpensesData(expensesRes);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load analytics data:', err);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchAnalytics();
  }, [selectedBranch, range]);

  // Real-time synchronization
  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail.type === 'sales' || e.detail.type === 'inventory') {
        fetchAnalytics();
      }
    };
    window.addEventListener('db-update', handleUpdate);
    return () => window.removeEventListener('db-update', handleUpdate);
  }, [selectedBranch, range]);

  // ── Revenue Trend (aggregate by day) ────────────
  const revenueTrend = useMemo(() => {
    const map = new Map<string, { revenue: number; sales: number }>();
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      map.set(key, { revenue: 0, sales: 0 });
    }
    for (const s of salesData) {
      const key = s.created_at.split('T')[0];
      const entry = map.get(key);
      if (entry) {
        entry.revenue += s.total;
        entry.sales += 1;
      }
    }
    return Array.from(map.entries()).map(([date, v]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue: Math.round(v.revenue * 100) / 100,
      sales: v.sales,
    }));
  }, [salesData, range]);

  // ── Top 10 Books ────────────────────────────────
  const topBooks = useMemo(() => stats?.topBooks?.slice(0, 10) || [], [stats]);

  // ── Category Distribution ──────────────────────
  const categoryData = useMemo(
    () => stats?.categoryBreakdown?.map((c: any) => ({ name: c.category, value: c.value })) || [],
    [stats],
  );

  // ── Branch Comparison ─────────────────────────
  const branchComparison = useMemo(() => stats?.branchPerformance || [], [stats]);

  // ── Payment Method ────────────────────────────
  const paymentMethods = useMemo(() => {
    const map: Record<string, number> = { Cash: 0, Card: 0, Mobile: 0 };
    for (const s of salesData) {
      if (s.payment_method === 'cash') map['Cash'] += s.total;
      else if (s.payment_method === 'card') map['Card'] += s.total;
      else map['Mobile'] += s.total;
    }
    return Object.entries(map).map(([name, value]) => ({
      name,
      value: Math.round(value * 100) / 100,
    }));
  }, [salesData]);

  // ── Profit Analysis ───────────────────────────
  const profitData = useMemo(() => {
    const totalRevenue = salesData.reduce((s, sale) => s + sale.total, 0);
    const totalCost = salesData.reduce((s, sale) => {
      return (
        s +
        (sale.items ?? []).reduce((is: number, it: any) => {
          const costPrice = it.book?.cost_price ?? 0;
          return is + costPrice * it.quantity;
        }, 0)
      );
    }, 0);
    const totalExpenses = expensesData.reduce((s, e) => s + e.amount, 0);
    const grossProfit = totalRevenue - totalCost;
    const netProfit = grossProfit - totalExpenses;
    const margin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    return {
      totalRevenue: Math.round(totalRevenue),
      totalCost: Math.round(totalCost),
      totalExpenses: Math.round(totalExpenses),
      grossProfit: Math.round(grossProfit),
      netProfit: Math.round(netProfit),
      margin: Math.round(margin * 10) / 10,
      netMargin: Math.round(netMargin * 10) / 10,
    };
  }, [salesData, expensesData]);

  const rangeButtons: { label: string; value: 7 | 30 | 90 }[] = [
    { label: '7D', value: 7 },
    { label: '30D', value: 30 },
    { label: '90D', value: 90 },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <BarChart3 className="w-7 h-7 text-indigo-400" />
            </div>
            Analytics &amp; Insights
          </h1>
          <p className="text-white/50 mt-1">Deep dive into your bookshop performance</p>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10 shrink-0">
          {rangeButtons.map((btn) => (
            <button
              key={btn.value}
              onClick={() => setRange(btn.value)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                range === btn.value
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/25'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </motion.div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-white/40">
          <div className="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin mb-4" />
          <p className="text-sm">Loading advanced analytics...</p>
        </div>
      ) : (
        <>
          {/* Profit & Margin Summary */}
          <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <SummaryBlock
              label="Gross Profit"
              value={`$${profitData.grossProfit.toLocaleString()}`}
              detail={`Margin: ${profitData.margin}%`}
              icon={<TrendingUp className="w-5 h-5 text-emerald-400" />}
              isPositive
            />
            <SummaryBlock
              label="Net Profit"
              value={`$${profitData.netProfit.toLocaleString()}`}
              detail={`Net Margin: ${profitData.netMargin}%`}
              icon={<DollarSign className="w-5 h-5 text-indigo-400" />}
              isPositive={profitData.netProfit >= 0}
            />
            <SummaryBlock
              label="Operating Cost"
              value={`$${profitData.totalCost.toLocaleString()}`}
              detail="Total Cost of Goods Sold"
              icon={<CreditCard className="w-5 h-5 text-purple-400" />}
            />
            <SummaryBlock
              label="Overhead Expenses"
              value={`$${profitData.totalExpenses.toLocaleString()}`}
              detail="Rent, Salaries & Utilities"
              icon={<GitBranch className="w-5 h-5 text-rose-400" />}
            />
          </motion.div>

          {/* Revenue Area Chart */}
          <motion.div variants={item} className="glass-card p-6">
            <h3 className="text-base font-semibold text-white mb-6">Revenue Trend</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrend}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip content={<GlassTooltip />} />
                  <Area type="monotone" dataKey="revenue" stroke="#6366F1" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" name="Revenue" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Secondary Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Top Books & Categories */}
            <motion.div variants={item} className="glass-card p-6 space-y-6">
              <h3 className="text-base font-semibold text-white">Top 10 Selling Books</h3>
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topBooks} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis type="number" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis dataKey="title" type="category" stroke="rgba(255,255,255,0.4)" fontSize={10} width={130} tickLine={false} />
                    <Tooltip content={<GlassTooltip />} />
                    <Bar dataKey="revenue" fill="#8B5CF6" radius={[0, 4, 4, 0]} name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Category Breakdown & Payment Method */}
            <motion.div variants={item} className="glass-card p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-semibold text-white mb-6">Sales by Book Category</h3>
                <div className="h-[250px] w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={3} dataKey="value">
                        {categoryData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => value !== undefined ? `$${Number(value).toLocaleString()}` : ''} />
                      <Legend verticalAlign="bottom" height={36} iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            {/* Branch Performance Comparison */}
            <motion.div variants={item} className="xl:col-span-3 glass-card p-6">
              <h3 className="text-base font-semibold text-white mb-6">Branch Sales Comparison</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={branchComparison}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip content={<GlassTooltip />} />
                    <Bar dataKey="revenue" fill="#6366F1" radius={[4, 4, 0, 0]} name="Revenue" />
                    <Bar dataKey="sales" fill="#A78BFA" radius={[4, 4, 0, 0]} name="Orders" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Payment Method distribution */}
            <motion.div variants={item} className="xl:col-span-2 glass-card p-6">
              <h3 className="text-base font-semibold text-white mb-6">Payment Distribution</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={paymentMethods} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}>
                      {paymentMethods.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[(index + 3) % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => value !== undefined ? `$${Number(value).toLocaleString()}` : ''} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </motion.div>
  );
}

// ── Summary Subblock ──────────────────────────────────
function SummaryBlock({
  label, value, detail, icon, isPositive,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
  isPositive?: boolean;
}) {
  return (
    <div className="glass-card p-5 flex items-start gap-4">
      <div className="p-3 rounded-xl bg-white/5 border border-white/10 shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xs text-white/40 font-medium uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-white mt-1">{value}</p>
        <div className="flex items-center gap-1 mt-1.5 text-xs">
          {isPositive !== undefined && (
            isPositive ? (
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            )
          )}
          <span className={isPositive === undefined ? 'text-white/30' : isPositive ? 'text-emerald-400' : 'text-rose-400'}>
            {detail}
          </span>
        </div>
      </div>
    </div>
  );
}
