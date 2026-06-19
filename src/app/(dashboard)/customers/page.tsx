'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Search,
  Star,
  TrendingUp,
  ShoppingBag,
  Mail,
  Phone,
  ChevronDown,
  ChevronUp,
  Award,
  Crown,
  Gem,
  User,
  Download,
  Filter,
} from 'lucide-react';
import { apiClient as db } from '@/lib/apiClient';
import { useAppStore, useToastStore, useAuthStore } from '@/store';
import type { Sale } from '@/types';
import CsvImportModal from '@/components/CsvImportModal';

// ─── Loyalty Tier ─────────────────────────────────────────────────────────────
function getLoyaltyTier(totalSpent: number): {
  label: string;
  color: string;
  bg: string;
  icon: React.ElementType;
  min: number;
} {
  if (totalSpent >= 500)
    return { label: 'Diamond', color: 'text-cyan-300', bg: 'bg-cyan-500/10 border-cyan-500/30', icon: Gem, min: 500 };
  if (totalSpent >= 200)
    return { label: 'Gold', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30', icon: Crown, min: 200 };
  if (totalSpent >= 75)
    return { label: 'Silver', color: 'text-slate-300', bg: 'bg-slate-500/10 border-slate-500/30', icon: Award, min: 75 };
  return { label: 'Bronze', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30', icon: Star, min: 0 };
}

// ─── Derived Customer ─────────────────────────────────────────────────────────
interface DerivedCustomer {
  name: string;
  email: string;
  phone: string;
  totalSpent: number;
  totalOrders: number;
  avgOrderValue: number;
  lastPurchase: string;
  firstPurchase: string;
  preferredBranch: string;
  preferredPayment: string;
  purchases: Sale[];
  totalDue: number;
}

function deriveCustomers(sales: Sale[]): DerivedCustomer[] {
  const map = new Map<string, DerivedCustomer>();

  for (const sale of sales) {
    const key = sale.customer_email || sale.customer_name;
    if (!key || key === '' || key === 'Walk-in Customer') continue;

    if (!map.has(key)) {
      map.set(key, {
        name: sale.customer_name || 'Unknown',
        email: sale.customer_email || '',
        phone: sale.customer_phone || '',
        totalSpent: 0,
        totalOrders: 0,
        avgOrderValue: 0,
        lastPurchase: sale.created_at,
        firstPurchase: sale.created_at,
        preferredBranch: sale.branch_id || '',
        preferredPayment: sale.payment_method,
        purchases: [],
        totalDue: 0,
      });
    }

    const c = map.get(key)!;
    c.totalSpent += sale.total;
    c.totalDue += sale.amount_due || 0;
    c.totalOrders += 1;
    c.purchases.push(sale);

    if (!c.phone && sale.customer_phone) {
      c.phone = sale.customer_phone;
    }

    if (new Date(sale.created_at) > new Date(c.lastPurchase)) c.lastPurchase = sale.created_at;
    if (new Date(sale.created_at) < new Date(c.firstPurchase)) c.firstPurchase = sale.created_at;
  }

  return Array.from(map.values()).map((c) => ({
    ...c,
    avgOrderValue: c.totalOrders > 0 ? c.totalSpent / c.totalOrders : 0,
  }));
}


// ─── Format Helpers ───────────────────────────────────────────────────────────
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  if (d < 30) return `${d} days ago`;
  const m = Math.floor(d / 30);
  if (m < 12) return `${m} month${m > 1 ? 's' : ''} ago`;
  return `${Math.floor(m / 12)} year${Math.floor(m / 12) > 1 ? 's' : ''} ago`;
}

function fmtCurrency(n: number) {
  return `Rs. ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] } },
};

type SortKey = 'totalSpent' | 'totalOrders' | 'lastPurchase' | 'avgOrderValue';

// ─── CustomerRow ──────────────────────────────────────────────────────────────
function CustomerRow({
  customer,
  index,
  onPaymentRecorded,
}: {
  customer: DerivedCustomer;
  index: number;
  onPaymentRecorded?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payAmount, setPayAmount] = useState(customer.totalDue);
  const [payMethod, setPayMethod] = useState<'cash' | 'card' | 'mobile'>('cash');
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToastStore();

  useEffect(() => {
    setPayAmount(customer.totalDue);
  }, [customer.totalDue]);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (payAmount <= 0) return;
    if (!customer.phone) {
      addToast({
        type: 'error',
        title: 'Phone Required',
        message: 'This customer has no phone number on record. Repayments require phone tracking.',
      });
      return;
    }
    setSubmitting(true);
    try {
      await db.recordCustomerPayment(customer.phone, payAmount, payMethod);
      addToast({
        type: 'success',
        title: 'Repayment Recorded',
        message: `Logged Rs. ${payAmount.toFixed(2)} payment via ${payMethod}.`,
      });
      setShowPaymentModal(false);
      onPaymentRecorded?.();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Repayment Failed',
        message: err.message || 'Could not record customer payment.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const tier = getLoyaltyTier(customer.totalSpent);
  const TierIcon = tier.icon;

  const branchNames: Record<string, string> = {
    branch_001: 'Downtown Flagship',
    branch_002: 'University District',
    branch_003: 'Westside Mall',
  };

  return (
    <motion.div variants={itemVariants} className="glass-card overflow-hidden">
      {/* Main row */}
      <div
        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Rank */}
        <div className="w-8 text-center text-sm text-white/30 font-mono shrink-0">#{index + 1}</div>

        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
          {customer.name.charAt(0).toUpperCase()}
        </div>

        {/* Name & email */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white truncate flex items-center gap-2">
            {customer.name}
            {customer.totalDue > 0 && (
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 font-semibold animate-pulse">
                Due: {fmtCurrency(customer.totalDue)}
              </span>
            )}
          </p>
          <p className="text-xs text-white/40 truncate">{customer.email}</p>
        </div>


        {/* Tier badge */}
        <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium ${tier.bg} ${tier.color}`}>
          <TierIcon className="w-3 h-3" />
          {tier.label}
        </div>

        {/* Stats */}
        <div className="hidden md:block text-right">
          <p className="text-sm font-semibold text-white">{fmtCurrency(customer.totalSpent)}</p>
          <p className="text-xs text-white/40">{customer.totalOrders} orders</p>
        </div>
        <div className="hidden lg:block text-right">
          <p className="text-sm text-white/70">{fmtCurrency(customer.avgOrderValue)}</p>
          <p className="text-xs text-white/40">avg order</p>
        </div>
        <div className="hidden lg:block text-right text-sm text-white/50">
          {timeAgo(customer.lastPurchase)}
        </div>

        {/* Expand toggle */}
        <div className="text-white/30 shrink-0">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-white/5 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Contact Info */}
                <div>
                  <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Contact Info</h4>
                  <div className="space-y-2">
                    {customer.email && (
                      <div className="flex items-center gap-2 text-sm text-white/70">
                        <Mail className="w-4 h-4 text-indigo-400" />
                        <span>{customer.email}</span>
                      </div>
                    )}
                    {customer.phone && (
                      <div className="flex items-center gap-2 text-sm text-white/70">
                        <Phone className="w-4 h-4 text-indigo-400" />
                        <span>{customer.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-white/70">
                      <ShoppingBag className="w-4 h-4 text-indigo-400" />
                      <span>Preferred branch: <span className="text-white/90">{branchNames[customer.preferredBranch] || customer.preferredBranch}</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/70">
                      <User className="w-4 h-4 text-indigo-400" />
                      <span>Customer since: <span className="text-white/90">{fmtDate(customer.firstPurchase)}</span></span>
                    </div>
                  </div>
                </div>

                {/* Loyalty Progress */}
                <div>
                  <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Loyalty Progress</h4>
                  <div className={`p-3 rounded-xl border ${tier.bg} mb-3`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-semibold ${tier.color} flex items-center gap-1`}>
                        <TierIcon className="w-4 h-4" /> {tier.label} Member
                      </span>
                      <span className="text-xs text-white/50">{fmtCurrency(customer.totalSpent)} spent</span>
                    </div>
                    {/* Progress to next tier */}
                    {tier.label !== 'Diamond' && (() => {
                      const tiers = [
                        { label: 'Silver', min: 75 },
                        { label: 'Gold', min: 200 },
                        { label: 'Diamond', min: 500 },
                      ];
                      const next = tiers.find(t => customer.totalSpent < t.min);
                      if (!next) return null;
                      const pct = Math.min(100, (customer.totalSpent / next.min) * 100);
                      return (
                        <div>
                          <div className="flex justify-between text-xs text-white/40 mb-1">
                            <span>{fmtCurrency(customer.totalSpent)}</span>
                            <span>{fmtCurrency(next.min)} for {next.label}</span>
                          </div>
                          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
                              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                            />
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Credit Ledger Repayment Section */}
              <div className={`mt-4 p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
                customer.totalDue > 0
                  ? 'bg-rose-500/5 border-rose-500/10'
                  : 'bg-emerald-500/5 border-emerald-500/10'
              }`}>
                <div>
                  <h4 className={`text-sm font-bold flex items-center gap-2 ${
                    customer.totalDue > 0 ? 'text-rose-400' : 'text-emerald-400'
                  }`}>
                    <TrendingUp className="w-4 h-4" /> Credit Ledger
                  </h4>
                  <p className="text-xs text-white/60 mt-1">
                    {customer.totalDue > 0 ? (
                      <>Customer has an outstanding balance of <span className="text-rose-400 font-semibold">{fmtCurrency(customer.totalDue)}</span>.</>
                    ) : (
                      <>Account is clear. No outstanding balances.</>
                    )}
                  </p>
                </div>
                {customer.totalDue > 0 && (
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-lg shadow-rose-600/20 transition-all shrink-0"
                  >
                    Record Repayment
                  </button>
                )}
              </div>

              {/* Recent purchases */}
              <div className="mt-4">
                <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Recent Purchases</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {customer.purchases.slice(0, 5).map((sale) => (
                    <div key={sale.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/[0.02] border border-white/5 text-sm">
                      <div>
                        <span className="font-mono text-indigo-400 text-xs">#{sale.id.slice(-6).toUpperCase()}</span>
                        <span className="text-white/40 text-xs ml-2">{fmtDate(sale.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                          sale.payment_method === 'cash'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : sale.payment_method === 'card'
                            ? 'bg-blue-500/10 text-blue-400'
                            : sale.payment_method === 'mobile'
                            ? 'bg-cyan-500/10 text-cyan-400'
                            : 'bg-violet-500/10 text-violet-400'
                        }`}>{sale.payment_method}</span>
                        <span className="font-semibold text-white">{fmtCurrency(sale.total)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Repayment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPaymentModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl bg-[#0F0F16] border border-white/10 p-6 shadow-2xl"
            >
              <h3 className="text-lg font-bold text-white mb-2">Record Repayment</h3>
              <p className="text-xs text-white/40 mb-4">
                Record outstanding balance clearance for {customer.name}.
              </p>
              
              <form onSubmit={handleRecordPayment} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Outstanding Balance</label>
                  <div className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/10 text-rose-400 font-semibold text-sm">
                    {fmtCurrency(customer.totalDue)}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Payment Amount (Rs.)</label>
                  <input
                    type="number"
                    min="1"
                    max={customer.totalDue}
                    step="0.01"
                    value={payAmount || ''}
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                    required
                    className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] px-3.5 py-2.5 text-sm text-white focus:border-indigo-500/50 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['cash', 'card', 'mobile'] as const).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPayMethod(method)}
                        className={`py-2 text-xs font-medium capitalize rounded-lg border transition-all ${
                          payMethod === method
                            ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                            : 'bg-white/[0.03] border-white/[0.06] text-white/40 hover:bg-white/[0.06]'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-white/50 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || payAmount <= 0}
                    className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 rounded-lg shadow-lg shadow-indigo-600/20 transition-all"
                  >
                    {submitting ? 'Recording...' : 'Record Payment'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}


// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CustomersPage() {
  const { selectedBranch } = useAppStore();
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('totalSpent');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [tierFilter, setTierFilter] = useState<string>('All');
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSales = async () => {
    try {
      const data = await db.getSales(selectedBranch || undefined);
      setSales(data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load sales for customers:', err);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchSales();
  }, [selectedBranch]);

  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail?.type === 'sales') {
        fetchSales();
      }
    };
    window.addEventListener('db-update', handleUpdate);
    return () => window.removeEventListener('db-update', handleUpdate);
  }, [selectedBranch]);

  const customers = useMemo(() => deriveCustomers(sales), [sales]);

  const filtered = useMemo(() => {
    let result = customers;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.phone.includes(q),
      );
    }

    if (tierFilter !== 'All') {
      result = result.filter((c) => getLoyaltyTier(c.totalSpent).label === tierFilter);
    }

    result = [...result].sort((a, b) => {
      const aVal = sortKey === 'lastPurchase' ? new Date(a.lastPurchase).getTime() : (a[sortKey] as number);
      const bVal = sortKey === 'lastPurchase' ? new Date(b.lastPurchase).getTime() : (b[sortKey] as number);
      return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
    });

    return result;
  }, [customers, search, tierFilter, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    else { setSortKey(key); setSortDir('desc'); }
  };

  // Summary stats
  const totalRevenue = customers.reduce((s, c) => s + c.totalSpent, 0);
  const tierCounts = {
    Diamond: customers.filter((c) => getLoyaltyTier(c.totalSpent).label === 'Diamond').length,
    Gold: customers.filter((c) => getLoyaltyTier(c.totalSpent).label === 'Gold').length,
    Silver: customers.filter((c) => getLoyaltyTier(c.totalSpent).label === 'Silver').length,
    Bronze: customers.filter((c) => getLoyaltyTier(c.totalSpent).label === 'Bronze').length,
  };

  const statCards = [
    { label: 'Total Customers', value: customers.length.toString(), icon: Users, color: 'indigo', glow: 'stat-glow-indigo' },
    { label: 'Total Revenue', value: fmtCurrency(totalRevenue), icon: TrendingUp, color: 'emerald', glow: 'stat-glow-emerald' },
    { label: 'Diamond Members', value: tierCounts.Diamond.toString(), icon: Gem, color: 'amber', glow: 'stat-glow-amber' },
    { label: 'Avg Lifetime Value', value: customers.length > 0 ? fmtCurrency(totalRevenue / customers.length) : 'Rs. 0', icon: Star, color: 'rose', glow: 'stat-glow-rose' },
  ];

  const tierFilters = ['All', 'Diamond', 'Gold', 'Silver', 'Bronze'];
  const sortOptions: { key: SortKey; label: string }[] = [
    { key: 'totalSpent', label: 'Total Spent' },
    { key: 'totalOrders', label: 'Orders' },
    { key: 'avgOrderValue', label: 'Avg Order' },
    { key: 'lastPurchase', label: 'Last Purchase' },
  ];

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-8 min-h-screen bg-surface-0 bg-grid">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-48 rounded-lg bg-white/5 animate-pulse" />
            <div className="h-4 w-64 rounded-lg bg-white/5 animate-pulse" />
          </div>
          <div className="h-10 w-28 rounded-xl bg-white/5 animate-pulse" />
        </div>
        {/* Stats Row Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Customers</h1>
          <p className="text-white/40 mt-1">
            {customers.length} customers · {fmtCurrency(totalRevenue)} total revenue
          </p>
        </div>
        <div className="flex items-center gap-2">
          {user?.role !== 'cashier' && (
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm hover:bg-white/10 transition-colors"
            >
              <Download className="w-4 h-4" />
              Import CSV
            </button>
          )}
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm hover:bg-white/10 transition-colors">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              variants={itemVariants}
              whileHover={{ scale: 1.02, y: -2 }}
              className={`glass-card ${card.glow} p-5`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-xl bg-${card.color}-500/10`}>
                  <Icon className={`w-5 h-5 text-${card.color}-400`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{card.value}</p>
              <p className="text-xs text-white/40 mt-1">{card.label}</p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Tier breakdown */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">Loyalty Tier Breakdown</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { tier: 'Diamond', count: tierCounts.Diamond, icon: Gem, color: 'text-cyan-300', bg: 'bg-cyan-500/10 border-cyan-500/30' },
            { tier: 'Gold', count: tierCounts.Gold, icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' },
            { tier: 'Silver', count: tierCounts.Silver, icon: Award, color: 'text-slate-300', bg: 'bg-slate-500/10 border-slate-500/30' },
            { tier: 'Bronze', count: tierCounts.Bronze, icon: Star, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30' },
          ].map(({ tier, count, icon: TierIcon, color, bg }) => (
            <div key={tier} className={`flex items-center gap-3 p-3 rounded-xl border ${bg}`}>
              <TierIcon className={`w-5 h-5 ${color}`} />
              <div>
                <p className={`text-sm font-semibold ${color}`}>{tier}</p>
                <p className="text-lg font-bold text-white">{count}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="glass-card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.07] transition-all"
            />
          </div>

          {/* Tier filter */}
          <div className="flex gap-2 flex-wrap">
            {tierFilters.map((t) => (
              <button
                key={t}
                onClick={() => setTierFilter(t)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  tierFilter === t
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-white/30" />
            <select
              value={sortKey}
              onChange={(e) => toggleSort(e.target.value as SortKey)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white/70 focus:outline-none focus:border-indigo-500/50"
            >
              {sortOptions.map((o) => (
                <option key={o.key} value={o.key} className="bg-[#12121A]">{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Column headers (desktop) */}
      <div className="hidden lg:grid grid-cols-[32px_40px_1fr_120px_130px_120px_120px_24px] gap-4 px-4 text-xs text-white/30 uppercase tracking-wider font-semibold">
        <span>#</span>
        <span></span>
        <span>Customer</span>
        <span>Tier</span>
        <span className="text-right cursor-pointer hover:text-white/60 transition-colors" onClick={() => toggleSort('totalSpent')}>Total Spent {sortKey === 'totalSpent' && (sortDir === 'desc' ? '↓' : '↑')}</span>
        <span className="text-right cursor-pointer hover:text-white/60 transition-colors" onClick={() => toggleSort('avgOrderValue')}>Avg Order {sortKey === 'avgOrderValue' && (sortDir === 'desc' ? '↓' : '↑')}</span>
        <span className="text-right cursor-pointer hover:text-white/60 transition-colors" onClick={() => toggleSort('lastPurchase')}>Last Visit {sortKey === 'lastPurchase' && (sortDir === 'desc' ? '↓' : '↑')}</span>
        <span></span>
      </div>

      {/* Customer list */}
      {filtered.length === 0 ? (
        <div className="glass-card py-20 flex flex-col items-center gap-4 text-white/30">
          <Users className="w-12 h-12" />
          <p className="text-lg font-medium">No customers found</p>
          <p className="text-sm">Try adjusting your search or filters</p>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-2"
        >
          {filtered.map((customer, i) => (
            <CustomerRow key={customer.email || customer.name} customer={customer} index={i} onPaymentRecorded={fetchSales} />
          ))}
        </motion.div>
      )}
      <AnimatePresence>
        {showImportModal && (
          <CsvImportModal
            type="customers"
            onClose={() => setShowImportModal(false)}
            onSuccess={() => {
              setShowImportModal(false);
              fetchSales();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
