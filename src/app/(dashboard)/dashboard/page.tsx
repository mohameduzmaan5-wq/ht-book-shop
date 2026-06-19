'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  ShoppingCart,
  BookOpen,
  GitBranch,
  Clock,
  AlertTriangle,
  Trophy,
  Hash,
  ArrowUpRight,
  Users,
  TrendingUp,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { apiClient as db } from '@/lib/apiClient';
import { useAppStore, useAuthStore } from '@/store';
import StatCard from '@/components/dashboard/StatCard';
import RevenueChart from '@/components/dashboard/RevenueChart';
import BranchChart from '@/components/dashboard/BranchChart';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] } },
};

export default function DashboardPage() {
  const selectedBranch = useAppStore((s) => s.selectedBranch);
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const isSuperAdmin = user?.role === 'super_admin';
  const isCashier = user?.role === 'cashier';

  const fetchStats = async () => {
    try {
      const data = await db.getDashboardStats(selectedBranch ?? undefined);
      setStats(data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [selectedBranch]);

  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail.type === 'sales' || e.detail.type === 'inventory') {
        fetchStats();
      }
    };
    window.addEventListener('db-update', handleUpdate);
    return () => window.removeEventListener('db-update', handleUpdate);
  }, [selectedBranch]);

  if (loading || !stats) {
    return (
      <div className="min-h-screen bg-surface-0 bg-grid p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 rounded-lg bg-white/5 animate-pulse" />
            <div className="h-4 w-64 rounded-lg bg-white/5 animate-pulse" />
          </div>
          <div className="h-7 w-20 rounded-full bg-white/5 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          <div className="xl:col-span-3 h-[380px] rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
          <div className="xl:col-span-2 h-[380px] rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
        </div>
      </div>
    );
  }

  const dateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-surface-0 bg-grid">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6"
      >
        {/* Page header */}
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
              {isSuperAdmin && !selectedBranch ? 'All Branches Overview' : 'Branch Dashboard'}
            </h1>
            <p className="text-sm text-white/40 mt-1">
              {isSuperAdmin
                ? selectedBranch
                  ? `Filtered by branch • ${dateLabel}`
                  : `Viewing all ${stats.totalBranches} branches • ${dateLabel}`
                : `${dateLabel}`}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <div className="pulse-dot" />
            <span className="text-xs font-medium text-emerald-400">Live</span>
          </div>
        </motion.div>

        {/* ─── Stat Cards ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatCard
            title="Total Revenue"
            value={stats.totalRevenue}
            change={stats.revenueChange}
            icon={DollarSign}
            color="indigo"
            prefix="Rs. "
            index={0}
          />
          <StatCard
            title="Total Sales"
            value={stats.totalSales}
            change={stats.salesChange}
            icon={ShoppingCart}
            color="emerald"
            index={1}
          />
          <StatCard
            title="Total Books"
            value={stats.totalBooks}
            icon={BookOpen}
            color="amber"
            index={2}
          />
          {isSuperAdmin ? (
            <StatCard
              title="Active Branches"
              value={stats.totalBranches}
              icon={GitBranch}
              color="rose"
              index={3}
            />
          ) : (
            <StatCard
              title="Low Stock Items"
              value={stats.lowStockItems.length}
              icon={AlertTriangle}
              color="rose"
              index={3}
            />
          )}
        </div>

        {/* ─── Charts Row ─── */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          <div className="xl:col-span-3">
            <RevenueChart data={stats.dailyRevenue} />
          </div>
          <div className="xl:col-span-2">
            {/* Super admin sees branch comparison; others see category breakdown */}
            {isSuperAdmin ? (
              <BranchChart data={stats.branchPerformance} />
            ) : (
              <CategoryBreakdownWidget data={stats.categoryBreakdown} />
            )}
          </div>
        </div>

        {/* ─── Bottom Widgets ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Selling Books */}
          <motion.div
            variants={itemVariants}
            className="relative overflow-hidden rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Trophy className="w-4 h-4 text-amber-400" />
                </div>
                <h3 className="text-base font-semibold text-white">Top Selling Books</h3>
              </div>
              <span className="text-xs text-white/30">Last 30 days</span>
            </div>
            <div className="space-y-1">
              {stats.topBooks.length === 0 && (
                <p className="text-sm text-white/30 text-center py-8">No sales data yet</p>
              )}
              {stats.topBooks.slice(0, 6).map((book: any, idx: number) => (
                <motion.div
                  key={book.title}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + idx * 0.05 }}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.03] transition-colors group"
                >
                  <div className={`
                    flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold
                    ${idx === 0 ? 'bg-amber-500/15 text-amber-400' : ''}
                    ${idx === 1 ? 'bg-gray-400/15 text-gray-300' : ''}
                    ${idx === 2 ? 'bg-orange-500/15 text-orange-400' : ''}
                    ${idx > 2 ? 'bg-white/5 text-white/40' : ''}
                  `}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{book.title}</p>
                    <p className="text-xs text-white/35 truncate">{book.author}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-white">
                      Rs. {book.revenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-xs text-white/35">{book.sold} sold</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Recent Sales Feed */}
          <motion.div
            variants={itemVariants}
            className="relative overflow-hidden rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-500/10">
                  <Clock className="w-4 h-4 text-indigo-400" />
                </div>
                <h3 className="text-base font-semibold text-white">Recent Sales</h3>
              </div>
              <span className="text-xs text-white/30">Today</span>
            </div>
            <div className="space-y-1">
              {stats.recentSales.length === 0 && (
                <p className="text-sm text-white/30 text-center py-8">No sales today yet</p>
              )}
              {stats.recentSales.slice(0, 6).map((sale: any, idx: number) => {
                let timeAgo: string;
                try { timeAgo = formatDistanceToNow(new Date(sale.created_at), { addSuffix: true }); }
                catch { timeAgo = 'recently'; }

                return (
                  <motion.div
                    key={sale.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + idx * 0.05 }}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.03] transition-colors group"
                  >
                    <div className="flex-shrink-0 p-2 rounded-lg bg-emerald-500/10">
                      <Hash className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">
                        {sale.id.replace('sale_', '#')}
                      </p>
                      <p className="text-xs text-white/35 truncate">
                        {sale.branch?.name ?? sale.branch_id}
                        {sale.cashier?.name ? ` • ${sale.cashier.name}` : ''}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-emerald-400">
                        +Rs. {sale.total.toFixed(2)}
                      </p>
                      <p className="text-xs text-white/30">{timeAgo}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Low Stock Alerts */}
          <motion.div
            variants={itemVariants}
            className="relative overflow-hidden rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-rose-500/10">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                </div>
                <h3 className="text-base font-semibold text-white">Low Stock Alerts</h3>
              </div>
              <span className={`
                text-xs font-semibold px-2 py-0.5 rounded-full
                ${stats.lowStockItems.length > 0 ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}
              `}>
                {stats.lowStockItems.length} items
              </span>
            </div>
            <div className="space-y-1">
              {stats.lowStockItems.length === 0 && (
                <p className="text-sm text-white/30 text-center py-8">All stock levels healthy</p>
              )}
              {stats.lowStockItems.slice(0, 6).map((item: any, idx: number) => {
                const isCritical = item.quantity <= Math.floor(item.reorder_level / 2);
                return (
                  <motion.div
                    key={item.id ?? `${item.book_id}-${idx}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + idx * 0.05 }}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.03] transition-colors"
                  >
                    <div className={`
                      flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold
                      ${isCritical ? 'bg-rose-500/15 text-rose-400' : 'bg-amber-500/15 text-amber-400'}
                    `}>
                      {item.quantity}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {item.book?.title ?? item.book_id}
                      </p>
                      <p className="text-xs text-white/35 truncate">
                        {item.branch?.name ?? ''} · Reorder: {item.reorder_level}
                      </p>
                    </div>
                    <span className={`text-xs font-medium ${isCritical ? 'text-rose-400' : 'text-amber-400'}`}>
                      {isCritical ? 'Critical' : 'Low'}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* ─── Super Admin: Branch comparison table ─── */}
        {isSuperAdmin && !selectedBranch && stats.branchPerformance.length > 0 && (
          <motion.div
            variants={itemVariants}
            className="relative overflow-hidden rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-6"
          >
            <div className="flex items-center gap-2.5 mb-5">
              <div className="p-2 rounded-lg bg-indigo-500/10">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
              </div>
              <h3 className="text-base font-semibold text-white">Branch Comparison</h3>
              <span className="text-xs text-white/30 ml-auto">This month</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-white/40 text-xs uppercase tracking-wider border-b border-white/[0.06]">
                    <th className="text-left pb-3 font-medium">Branch</th>
                    <th className="text-right pb-3 font-medium">Revenue</th>
                    <th className="text-right pb-3 font-medium">Sales</th>
                    <th className="text-right pb-3 font-medium">Avg. Sale</th>
                    <th className="text-right pb-3 font-medium">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {stats.branchPerformance
                    .sort((a: any, b: any) => b.revenue - a.revenue)
                    .map((branch: any, idx: number) => {
                      const totalRev = stats.branchPerformance.reduce((s: number, b: any) => s + b.revenue, 0);
                      const share = totalRev > 0 ? ((branch.revenue / totalRev) * 100).toFixed(1) : '0.0';
                      const avg = branch.sales > 0 ? (branch.revenue / branch.sales) : 0;
                      return (
                        <tr key={branch.name} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="py-3 text-white font-medium">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-indigo-400' : idx === 1 ? 'bg-violet-400' : 'bg-purple-400'}`} />
                              {branch.name}
                            </div>
                          </td>
                          <td className="py-3 text-right text-white">
                            Rs. {branch.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 text-right text-white/70">{branch.sales}</td>
                          <td className="py-3 text-right text-white/70">
                            Rs. {avg.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 text-right">
                            <span className="inline-flex items-center gap-1">
                              <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-indigo-400"
                                  style={{ width: `${share}%` }}
                                />
                              </div>
                              <span className="text-white/50 text-xs">{share}%</span>
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

// ─── Category Breakdown Widget for branch users ───────
function CategoryBreakdownWidget({ data }: { data: { category: string; count: number; value: number }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const colors = ['bg-indigo-400', 'bg-violet-400', 'bg-emerald-400', 'bg-amber-400', 'bg-rose-400', 'bg-sky-400'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="relative overflow-hidden rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Inventory by Category</h3>
          <p className="text-sm text-white/40 mt-0.5">Current stock value breakdown</p>
        </div>
        <div className="p-2 rounded-lg bg-indigo-500/10">
          <BookOpen className="w-5 h-5 text-indigo-400" />
        </div>
      </div>
      <div className="space-y-3">
        {data.slice(0, 7).map((cat, idx) => {
          const pct = total > 0 ? (cat.value / total) * 100 : 0;
          return (
            <div key={cat.category}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-white/70 truncate">{cat.category}</span>
                <div className="text-right flex-shrink-0 ml-2">
                  <span className="text-sm font-semibold text-white">
                    Rs. {cat.value.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-xs text-white/30 ml-1.5">{cat.count} qty</span>
                </div>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className={`h-full rounded-full ${colors[idx % colors.length]} transition-all duration-700`}
                  style={{ width: `${pct.toFixed(1)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
