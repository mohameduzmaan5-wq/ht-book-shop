'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Calendar, ShoppingBag, Package, TrendingUp, Users,
  Download, FileSpreadsheet, File, ChevronDown, ChevronUp, X,
} from 'lucide-react';
import { apiClient as db } from '@/lib/apiClient';
import { useAppStore } from '@/store';

// ── Types ───────────────────────────────────────────
interface ReportConfig {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
}

const reports: ReportConfig[] = [
  {
    id: 'daily-sales',
    title: 'Daily Sales Report',
    description: 'Detailed breakdown of all sales transactions for a specific day, including items sold, revenue, and payment methods.',
    icon: ShoppingBag,
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/20',
  },
  {
    id: 'weekly-sales',
    title: 'Weekly Sales Report',
    description: 'Aggregated sales performance across the week with daily comparisons and trend analysis.',
    icon: Calendar,
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/20',
  },
  {
    id: 'monthly-sales',
    title: 'Monthly Sales Report',
    description: 'Comprehensive monthly overview with revenue targets, growth metrics, and category performance.',
    icon: TrendingUp,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
  },
  {
    id: 'inventory',
    title: 'Inventory Report',
    description: 'Current stock levels across all branches, low-stock alerts, and reorder recommendations.',
    icon: Package,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
  },
  {
    id: 'profit-loss',
    title: 'Profit & Loss Report',
    description: 'Complete P&L statement including revenue, cost of goods, operating expenses, and net margins.',
    icon: FileText,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
  },
  {
    id: 'employee',
    title: 'Employee Performance Report',
    description: 'Individual employee metrics including sales processed, average transaction value, and working hours.',
    icon: Users,
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/20',
  },
];

// ── Motion variants ─────────────────────────────────
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const card = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] } },
};

export default function ReportsPage() {
  const { selectedBranch } = useAppStore();
  const [activeReport, setActiveReport] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const generateReport = async (reportId: string) => {
    setLoadingPreview(true);
    try {
      const allSales = await db.getSales(selectedBranch ?? undefined, 30);

      switch (reportId) {
        case 'daily-sales':
        case 'weekly-sales':
        case 'monthly-sales': {
          const days = reportId === 'daily-sales' ? 1 : reportId === 'weekly-sales' ? 7 : 30;
          const sales = await db.getSales(selectedBranch ?? undefined, days);
          setPreviewData({
            headers: ['Date', 'Transaction ID', 'Customer', 'Items', 'Payment', 'Total'],
            rows: sales.slice(0, 12).map((s) => [
              new Date(s.created_at).toLocaleDateString(),
              s.id.replace('sale_', '#'),
              s.customer_name,
              String(s.items?.length ?? 0),
              s.payment_method.charAt(0).toUpperCase() + s.payment_method.slice(1),
              `Rs. ${s.total.toFixed(2)}`,
            ]),
            summary: {
              totalSales: sales.length,
              totalRevenue: sales.reduce((sum, s) => sum + s.total, 0),
              avgTransaction: sales.length > 0 ? sales.reduce((sum, s) => sum + s.total, 0) / sales.length : 0,
            },
          });
          break;
        }
        case 'inventory': {
          const books = await db.getBooks();
          const lowStock = await db.getLowStock(selectedBranch ?? undefined);
          setPreviewData({
            headers: ['Book Title', 'Category', 'Cost Price', 'Selling Price', 'Stock Status'],
            rows: books.slice(0, 12).map((b) => {
              const isLow = lowStock.some((ls) => ls.book_id === b.id);
              return [
                b.title.length > 30 ? b.title.slice(0, 30) + '…' : b.title,
                b.category,
                `Rs. ${b.cost_price.toFixed(2)}`,
                `Rs. ${b.selling_price.toFixed(2)}`,
                isLow ? '⚠ Low' : '✓ OK',
              ];
            }),
            summary: {
              totalBooks: books.length,
              lowStockCount: lowStock.length,
              totalValue: 0,
            },
          });
          break;
        }
        case 'profit-loss': {
          const expenses = await db.getExpenses(selectedBranch ?? undefined);
          const revenue = allSales.reduce((s, sale) => s + sale.total, 0);
          const cost = allSales.reduce(
            (s, sale) =>
              s + (sale.items ?? []).reduce((is, it) => is + (it.book?.cost_price ?? 0) * it.quantity, 0),
            0,
          );
          const totalExp = expenses.reduce((s, e) => s + e.amount, 0);
          setPreviewData({
            headers: ['Category', 'Amount', '% of Revenue'],
            rows: [
              ['Total Revenue', `Rs. ${revenue.toFixed(2)}`, '100%'],
              ['Cost of Goods Sold', `Rs. ${cost.toFixed(2)}`, `${revenue > 0 ? ((cost / revenue) * 100).toFixed(1) : 0}%`],
              ['Gross Profit', `Rs. ${(revenue - cost).toFixed(2)}`, `${revenue > 0 ? (((revenue - cost) / revenue) * 100).toFixed(1) : 0}%`],
              ['Operating Expenses', `Rs. ${totalExp.toFixed(2)}`, `${revenue > 0 ? ((totalExp / revenue) * 100).toFixed(1) : 0}%`],
              ['Net Profit', `Rs. ${(revenue - cost - totalExp).toFixed(2)}`, `${revenue > 0 ? (((revenue - cost - totalExp) / revenue) * 100).toFixed(1) : 0}%`],
            ],
            summary: { totalRevenue: revenue, totalExpenses: totalExp, netProfit: revenue - cost - totalExp },
          });
          break;
        }
        case 'employee': {
          const employees = await db.getEmployees(selectedBranch ?? undefined);
          const branchList = await db.getBranches();
          setPreviewData({
            headers: ['Name', 'Role', 'Branch', 'Sales Processed', 'Revenue Generated'],
            rows: employees.slice(0, 12).map((emp) => {
              const empSales = allSales.filter((s) => s.cashier_id === emp.id);
              const rev = empSales.reduce((s, sale) => s + sale.total, 0);
              const branchName = branchList.find(b => b.id === emp.branch_id)?.name ?? '—';
              return [
                emp.name,
                emp.role.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
                emp.branch_id ? branchName : 'All',
                String(empSales.length),
                `Rs. ${rev.toFixed(2)}`,
              ];
            }),
            summary: {
              totalEmployees: employees.length,
            },
          });
          break;
        }
      }
    } catch (err) {
      console.error('Failed to generate report data:', err);
    } finally {
      setLoadingPreview(false);
    }
  };

  useEffect(() => {
    if (activeReport) {
      generateReport(activeReport);
    } else {
      setPreviewData(null);
    }
  }, [activeReport, selectedBranch]);

  // Real-time synchronization
  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (activeReport && (e.detail.type === 'sales' || e.detail.type === 'inventory')) {
        generateReport(activeReport);
      }
    };
    window.addEventListener('db-update', handleUpdate);
    return () => window.removeEventListener('db-update', handleUpdate);
  }, [activeReport, selectedBranch]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <div className="p-2 rounded-xl bg-brand-600/20 border border-brand-500/20">
            <FileText className="w-7 h-7 text-brand-400" />
          </div>
          System Reports
        </h1>
        <p className="text-white/50 mt-1">Generate and export multi-branch enterprise reports</p>
      </div>

      {/* Reports Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
      >
        {reports.map((rep) => {
          const Icon = rep.icon;
          const isActive = activeReport === rep.id;
          return (
            <motion.div
              key={rep.id}
              variants={card}
              onClick={() => setActiveReport(isActive ? null : rep.id)}
              className={`
                glass-card-hover p-6 cursor-pointer flex flex-col justify-between border transition-all duration-300
                ${isActive ? 'border-brand-500/50 bg-brand-500/[0.04] shadow-lg shadow-brand-600/5' : 'border-white/[0.06]'}
              `}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`p-2.5 rounded-xl ${rep.bgColor} ${rep.color} border ${rep.borderColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {isActive ? (
                    <ChevronUp className="w-4 h-4 text-white/30" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-white/30" />
                  )}
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-semibold text-white">{rep.title}</h3>
                  <p className="text-xs text-white/40 leading-relaxed">{rep.description}</p>
                </div>
              </div>

              <div className="border-t border-white/5 pt-4 mt-5 flex items-center justify-between">
                <span className="text-xs text-brand-400 font-semibold">
                  {isActive ? 'Hide Preview' : 'Configure & Preview'}
                </span>
                <span className="text-[10px] text-white/20 uppercase tracking-wider font-bold">PDF / CSV</span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Report Preview Section */}
      <AnimatePresence>
        {activeReport && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ type: 'spring', damping: 24, stiffness: 220 }}
            className="glass-card p-6 space-y-6"
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-white/5">
                  <FileText className="w-4 h-4 text-brand-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">
                    {reports.find((r) => r.id === activeReport)?.title} - Preview
                  </h3>
                  <p className="text-xs text-white/40 mt-0.5">
                    Showing generated data table for the last 30 days
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveReport(null)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {loadingPreview ? (
              <div className="flex flex-col items-center justify-center py-20 text-white/40">
                <div className="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin mb-4" />
                <p className="text-sm">Generating report details...</p>
              </div>
            ) : previewData ? (
              <>
                {/* Summary block */}
                {previewData.summary && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    {Object.entries(previewData.summary).map(([key, val]: any) => (
                      <div key={key} className="text-center sm:text-left">
                        <p className="text-[10px] text-white/30 uppercase font-semibold tracking-wider">
                          {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}
                        </p>
                        <p className="text-lg font-bold text-white mt-1">
                          {typeof val === 'number' && key.toLowerCase().includes('revenue') ? `Rs. ${val.toFixed(2)}` :
                           typeof val === 'number' && key.toLowerCase().includes('transaction') ? `Rs. ${val.toFixed(2)}` :
                           val.toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-white/5 text-white/40 font-medium">
                        {previewData.headers.map((h: string) => (
                          <th key={h} className="px-4 py-3">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.rows.map((row: string[], idx: number) => (
                        <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors text-white/80">
                          {row.map((cell: string, cIdx: number) => (
                            <td key={cIdx} className="px-4 py-3 font-medium">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Export Buttons */}
                <div className="flex items-center justify-end gap-3 border-t border-white/5 pt-5">
                  <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-white/70 border border-white/10 transition-colors">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Export CSV
                  </button>
                  <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-semibold text-white transition-all shadow-lg shadow-brand-600/15">
                    <File className="w-4 h-4 text-indigo-200" /> Export PDF
                  </button>
                </div>
              </>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
