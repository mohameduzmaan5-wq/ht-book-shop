'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Plus, X, Edit3, UserX, Mail, Shield, Building2,
  Calendar, Search, UserCircle, Crown, Briefcase,
} from 'lucide-react';
import { apiClient as db } from '@/lib/apiClient';
import { useAppStore, useToastStore } from '@/store';
import type { User, UserRole } from '@/types';

// ── Constants ─────────────────────────────────────────
const ROLE_TABS: { label: string; value: UserRole | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Super Admin', value: 'super_admin' },
  { label: 'Branch Manager', value: 'branch_manager' },
  { label: 'Cashier', value: 'cashier' },
];

const ROLE_BADGE: Record<UserRole, { bg: string; text: string; icon: React.ReactNode }> = {
  super_admin: { bg: 'bg-purple-500/15', text: 'text-purple-400', icon: <Crown size={12} /> },
  branch_manager: { bg: 'bg-blue-500/15', text: 'text-blue-400', icon: <Briefcase size={12} /> },
  cashier: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', icon: <UserCircle size={12} /> },
};

const ROLE_LABEL: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  branch_manager: 'Branch Manager',
  cashier: 'Cashier',
};

// ── Role Badge ────────────────────────────────────────
function RoleBadge({ role }: { role: UserRole }) {
  const { bg, text, icon } = ROLE_BADGE[role];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
      {icon} {ROLE_LABEL[role]}
    </span>
  );
}

// ── Add Employee Modal ────────────────────────────────
function AddEmployeeModal({ onClose, onAdd }: { onClose: () => void; onAdd: () => void }) {
  const { addToast } = useToastStore();
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'cashier' as UserRole, branch_id: '',
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    db.getBranches().then(setBranches).catch(console.error);
  }, []);

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.password) {
      addToast({
        type: 'warning',
        title: 'Validation Error',
        message: 'Please fill in Name, Email and Password.',
      });
      return;
    }
    setLoading(true);
    try {
      await db.createEmployee({
        name: form.name,
        email: form.email,
        role: form.role,
        branch_id: form.role === 'super_admin' ? null : form.branch_id || null,
        is_active: true,
        avatar: '',
      });
      addToast({
        type: 'success',
        title: 'Employee Added',
        message: `Successfully registered "${form.name}" as ${ROLE_LABEL[form.role]}.`,
      });
      onAdd();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Error',
        message: err.message || 'Failed to create employee.',
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
          <h2 className="text-xl font-semibold text-white">Add New Employee</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <ModalField label="Full Name" value={form.name} onChange={set('name')} placeholder="e.g. John Doe" />
          <ModalField label="Email Address" value={form.email} onChange={set('email')} placeholder="john@bookshop.com" type="email" />
          <ModalField label="Temporary Password" value={form.password} onChange={set('password')} placeholder="••••••••" type="password" />
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1.5">Role</label>
              <select
                value={form.role} onChange={set('role')}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
              >
                <option value="cashier" className="bg-[#12121A]">Cashier</option>
                <option value="branch_manager" className="bg-[#12121A]">Branch Manager</option>
                <option value="super_admin" className="bg-[#12121A]">Super Admin</option>
              </select>
            </div>

            {form.role !== 'super_admin' && (
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1.5">Branch Assignment</label>
                <select
                  value={form.branch_id} onChange={set('branch_id')}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                >
                  <option value="" className="bg-[#12121A]">Select branch...</option>
                  {branches.map(b => <option key={b.id} value={b.id} className="bg-[#12121A]">{b.name}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
          <button onClick={onClose} disabled={loading} className="px-5 py-2.5 rounded-xl bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all text-sm font-medium">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading} className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white transition-all text-sm font-medium shadow-lg shadow-brand-600/25">
            {loading ? 'Adding...' : 'Add Employee'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ModalField({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-white/60 mb-1.5">{label}</label>
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
      />
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────
export default function EmployeesPage() {
  const selectedBranch = useAppStore(s => s.selectedBranch);
  const { addToast } = useToastStore();

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<UserRole | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [employees, setEmployees] = useState<User[]>([]);
  const [branches, setBranches] = useState<any[]>([]);

  const fetchEmployeesData = async () => {
    try {
      const list = await db.getEmployees(selectedBranch || undefined);
      const branchList = await db.getBranches();
      setEmployees(list);
      setBranches(branchList);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load employees:', err);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchEmployeesData();
  }, [selectedBranch]);

  // Real-time synchronization
  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail.type === 'employees') {
        fetchEmployeesData();
      }
    };
    window.addEventListener('db-update', handleUpdate);
    return () => window.removeEventListener('db-update', handleUpdate);
  }, [selectedBranch]);

  const handleDeactivate = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to deactivate employee "${name}"?`)) return;
    try {
      await db.deactivateEmployee(id);
      addToast({
        type: 'success',
        title: 'Employee Deactivated',
        message: `Deactivated account of "${name}".`,
      });
      fetchEmployeesData();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Error',
        message: err.message || 'Failed to deactivate employee.',
      });
    }
  };

  // Filter & Search
  const filtered = useMemo(() => {
    return employees.filter(emp => {
      const matchesRole = activeTab === 'all' || emp.role === activeTab;
      const matchesSearch = search === '' ||
        emp.name.toLowerCase().includes(search.toLowerCase()) ||
        emp.email.toLowerCase().includes(search.toLowerCase());
      return matchesRole && matchesSearch;
    });
  }, [employees, activeTab, search]);

  const stats = useMemo(() => {
    const total = employees.length;
    const managers = employees.filter(e => e.role === 'branch_manager').length;
    const cashiers = employees.filter(e => e.role === 'cashier').length;
    const active = employees.filter(e => e.is_active).length;
    return { total, managers, cashiers, active };
  }, [employees]);

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────── */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Employee Management</h1>
          <p className="text-white/50 mt-1">Manage credentials, permissions, and location assignments</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white transition-all text-sm font-medium shadow-lg shadow-brand-600/25">
          <Plus size={16} /> Add Employee
        </button>
      </motion.div>

      {/* ── Stats Row ───────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatItem icon={<Users size={20} />} label="Total Registered" value={loading ? '...' : stats.total.toString()} color="indigo" />
        <StatItem icon={<Briefcase size={20} />} label="Branch Managers" value={loading ? '...' : stats.managers.toString()} color="blue" />
        <StatItem icon={<UserCircle size={20} />} label="Cashiers" value={loading ? '...' : stats.cashiers.toString()} color="emerald" />
        <StatItem icon={<Shield size={20} />} label="Active Accounts" value={loading ? '...' : stats.active.toString()} color="amber" />
      </div>

      {/* ── Toolbar ─────────────── */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search employees by name or email..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all text-sm"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto p-1 bg-white/5 border border-white/10 rounded-xl shrink-0">
          {ROLE_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.value
                  ? 'bg-brand-600 text-white shadow'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Employees Grid ──────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-white/40">
          <div className="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin mb-4" />
          <p className="text-sm">Loading employees...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filtered.map(emp => {
              const assignedBranch = branches.find(b => b.id === emp.branch_id);
              return (
                <motion.div
                  key={emp.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass-card p-6 flex flex-col justify-between space-y-5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-lg font-bold text-white shadow-lg shadow-indigo-500/25">
                        {emp.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-white">{emp.name}</h3>
                        <p className="text-xs text-white/40 mt-0.5">{emp.email}</p>
                      </div>
                    </div>
                    <span className={`w-2 h-2 rounded-full ${emp.is_active ? 'bg-emerald-400' : 'bg-white/20'}`} title={emp.is_active ? 'Active' : 'Inactive'} />
                  </div>

                  <div className="space-y-2 border-t border-white/5 pt-4 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-white/40 flex items-center gap-1"><Shield size={12} /> Role</span>
                      <RoleBadge role={emp.role} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/40 flex items-center gap-1"><Building2 size={12} /> Location</span>
                      <span className="text-white font-medium">{assignedBranch?.name ?? 'All Branches'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/40 flex items-center gap-1"><Calendar size={12} /> Registered</span>
                      <span className="text-white/60">
                        {new Date(emp.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-auto">
                    <button className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white font-semibold transition-colors">
                      <Edit3 size={13} /> Edit Account
                    </button>
                    {emp.is_active && emp.role !== 'super_admin' && (
                      <button
                        onClick={() => handleDeactivate(emp.id, emp.name)}
                        className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-semibold transition-colors"
                      >
                        <UserX size={13} /> Deactivate
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filtered.length === 0 && (
            <div className="col-span-full text-center py-20 bg-white/[0.01] border border-white/[0.03] rounded-2xl">
              <Users size={32} className="mx-auto mb-3 text-white/20" />
              <p className="text-sm font-medium text-white/40">No employees match the criteria</p>
            </div>
          )}
        </div>
      )}

      {/* Add Employee Modal */}
      <AnimatePresence>
        {showModal && (
          <AddEmployeeModal 
            onClose={() => setShowModal(false)} 
            onAdd={() => {
              setShowModal(false);
              fetchEmployeesData();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Helper Stats Item ─────────────────────────────────
function StatItem({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    indigo: 'text-brand-400 bg-brand-600/15',
    blue: 'text-blue-400 bg-blue-500/15',
    emerald: 'text-emerald-400 bg-emerald-500/15',
    amber: 'text-amber-400 bg-amber-500/15',
  };
  return (
    <div className="glass-card p-5 flex items-center gap-3.5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-white/45 font-medium uppercase tracking-wider">{label}</p>
        <p className="text-xl font-bold text-white mt-0.5">{value}</p>
      </div>
    </div>
  );
}
