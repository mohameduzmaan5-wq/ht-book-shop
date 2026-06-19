'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Phone, Mail, User, BookOpen, ShoppingCart, DollarSign,
  Plus, X, Eye, Edit3, Package, ArrowRightLeft, Clock, Building2,
} from 'lucide-react';
import { apiClient as db } from '@/lib/apiClient';
import { useAppStore, useToastStore } from '@/store';
import type { Branch, StockTransfer } from '@/types';

// ── Transfer Status Badge ─────────────────────────────
function TransferBadge({ status }: { status: StockTransfer['status'] }) {
  const styles: Record<string, string> = {
    pending: 'bg-amber-500/15 text-amber-400',
    approved: 'bg-blue-500/15 text-blue-400',
    completed: 'bg-emerald-500/15 text-emerald-400',
    rejected: 'bg-rose-500/15 text-rose-400',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${styles[status]}`}>
      {status}
    </span>
  );
}

// ── Add Branch Modal ──────────────────────────────────
function AddBranchModal({ onClose, onAdd }: { onClose: () => void; onAdd: () => void }) {
  const { addToast } = useToastStore();
  const [loading, setLoading] = useState(false);
  const [managers, setManagers] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: '', address: '', phone: '', email: '', manager: '',
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    db.getEmployees().then(users => {
      setManagers(users.filter(u => u.role === 'branch_manager'));
    }).catch(console.error);
  }, []);

  const handleSubmit = async () => {
    if (!form.name || !form.address || !form.phone || !form.email) {
      addToast({
        type: 'warning',
        title: 'Validation Error',
        message: 'Please fill in all fields.',
      });
      return;
    }
    setLoading(true);
    try {
      await db.createBranch({
        name: form.name,
        address: form.address,
        phone: form.phone,
        email: form.email,
        manager_id: form.manager || null,
        is_active: true,
      });
      addToast({
        type: 'success',
        title: 'Branch Created',
        message: `Successfully created "${form.name}".`,
      });
      onAdd();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Error',
        message: err.message || 'Failed to create branch.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="glass-card w-full max-w-lg p-6"
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Add New Branch</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <ModalField label="Branch Name" value={form.name} onChange={set('name')} placeholder="e.g. Eastside Branch" />
          <ModalField label="Address" value={form.address} onChange={set('address')} placeholder="Full address" />
          <div className="grid grid-cols-2 gap-4">
            <ModalField label="Phone" value={form.phone} onChange={set('phone')} placeholder="+1-555-0100" />
            <ModalField label="Email" value={form.email} onChange={set('email')} placeholder="branch@bookshop.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/60 mb-1.5">Manager</label>
            <select
              value={form.manager} onChange={set('manager')}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
            >
              <option value="" className="bg-[#12121A]">Select manager...</option>
              {managers.map(m => <option key={m.id} value={m.id} className="bg-[#12121A]">{m.name}</option>)}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
          <button onClick={onClose} disabled={loading} className="px-5 py-2.5 rounded-xl bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all text-sm font-medium">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading} className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white transition-all text-sm font-medium shadow-lg shadow-brand-600/25">
            {loading ? 'Adding...' : 'Add Branch'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ModalField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-white/60 mb-1.5">{label}</label>
      <input
        value={value} onChange={onChange} placeholder={placeholder}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
      />
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────
export default function BranchesPage() {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [branchData, setBranchData] = useState<any[]>([]);

  const fetchBranchesData = async () => {
    try {
      const branchesList = await db.getBranches();
      const transfersList = await db.getTransfers();
      const allUsers = await db.getEmployees();

      const branchStatsPromises = branchesList.map(async (branch) => {
        const inv = await db.getInventory(branch.id);
        const todaySales = await db.getSales(branch.id, 1);

        const totalBooks = inv.reduce((s, i) => s + i.quantity, 0);
        const todayRevenue = todaySales.reduce((s, sale) => s + sale.total, 0);
        const manager = allUsers.find(u => u.id === branch.manager_id) || allUsers.find(u => u.role === 'branch_manager' && u.branch_id === branch.id);

        return {
          branch,
          manager,
          totalBooks,
          salesCount: todaySales.length,
          revenue: todayRevenue,
        };
      });

      const stats = await Promise.all(branchStatsPromises);
      setTransfers(transfersList);
      setBranchData(stats);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load branches data:', err);
    }
  };

  useEffect(() => {
    fetchBranchesData();
  }, []);

  // Real-time synchronization
  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail.type === 'transfers' || e.detail.type === 'sales' || e.detail.type === 'inventory') {
        fetchBranchesData();
      }
    };
    window.addEventListener('db-update', handleUpdate);
    return () => window.removeEventListener('db-update', handleUpdate);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const cardVariant = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="space-y-8">
      {/* ── Header ──────────────── */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Branch Management</h1>
          <p className="text-white/50 mt-1">Oversee all bookshop locations and their performance</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white transition-all text-sm font-medium shadow-lg shadow-brand-600/25">
          <Plus size={16} /> Add Branch
        </button>
      </motion.div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-white/40">
          <div className="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin mb-4" />
          <p className="text-sm">Loading branches & transfers...</p>
        </div>
      ) : (
        <>
          {/* ── Branch Cards Grid ──── */}
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {branchData.map(({ branch, manager, totalBooks, salesCount, revenue }) => (
              <motion.div key={branch.id} variants={cardVariant} className="glass-card-hover p-6 flex flex-col">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-brand-600/20 flex items-center justify-center">
                      <Building2 size={22} className="text-brand-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{branch.name}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`w-2 h-2 rounded-full ${branch.is_active ? 'bg-emerald-400' : 'bg-white/30'}`} />
                        <span className={`text-xs ${branch.is_active ? 'text-emerald-400' : 'text-white/40'}`}>
                          {branch.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-2 mb-5 text-sm">
                  <InfoRow icon={<MapPin size={14} />} text={branch.address} />
                  <InfoRow icon={<Phone size={14} />} text={branch.phone} />
                  <InfoRow icon={<Mail size={14} />} text={branch.email} />
                  <InfoRow icon={<User size={14} />} text={manager ? `Manager: ${manager.name}` : 'No manager assigned'} highlight />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <MiniStat icon={<BookOpen size={14} />} label="Books" value={totalBooks.toLocaleString()} />
                  <MiniStat icon={<ShoppingCart size={14} />} label="Sales" value={salesCount.toString()} />
                  <MiniStat icon={<DollarSign size={14} />} label="Revenue" value={`$${revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-auto">
                  <button className="flex items-center gap-1.5 text-xs text-brand-400 font-semibold hover:underline">
                    <Eye size={14} /> View Details
                  </button>
                  <button className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors" title="Edit Location">
                    <Edit3 size={15} />
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* ── Stock Transfers ────── */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-500/10">
                  <ArrowRightLeft size={18} className="text-indigo-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">Stock Transfers Log</h2>
              </div>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-white/80 transition-colors border border-white/10">
                <Plus size={14} /> New Transfer
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-white/10 text-white/50 font-medium">
                    <th className="px-4 py-3">Book</th>
                    <th className="px-4 py-3">From Branch</th>
                    <th className="px-4 py-3">To Branch</th>
                    <th className="px-4 py-3">Qty</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Requested By</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transfers.map((tx: any) => (
                    <tr key={tx.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors text-white/85">
                      <td className="px-4 py-3.5 font-medium text-white">{tx.book?.title}</td>
                      <td className="px-4 py-3.5 text-white/60">{tx.from_branch?.name}</td>
                      <td className="px-4 py-3.5 text-white/60">{tx.to_branch?.name}</td>
                      <td className="px-4 py-3.5 font-semibold">{tx.quantity}</td>
                      <td className="px-4 py-3.5"><TransferBadge status={tx.status} /></td>
                      <td className="px-4 py-3.5 text-white/60">{tx.requester?.name}</td>
                      <td className="px-4 py-3.5 text-white/40 font-mono text-xs">
                        {new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                  {transfers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-white/30">
                        <Clock size={24} className="mx-auto mb-2 text-white/20" />
                        No recent stock transfer operations recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </>
      )}

      {/* Add Branch Modal */}
      <AnimatePresence>
        {showModal && (
          <AddBranchModal 
            onClose={() => setShowModal(false)} 
            onAdd={() => {
              setShowModal(false);
              fetchBranchesData();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Helper Subcomponents ──────────────────────────────
function InfoRow({ icon, text, highlight }: { icon: React.ReactNode; text: string; highlight?: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 ${highlight ? 'text-brand-400 font-medium' : 'text-white/60'}`}>
      <span className="text-white/30 flex-shrink-0">{icon}</span>
      <span className="truncate">{text}</span>
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-2.5 text-center">
      <div className="flex items-center justify-center gap-1 text-[10px] text-white/40 font-semibold tracking-wider uppercase mb-1">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-sm font-bold text-white">{value}</p>
    </div>
  );
}
