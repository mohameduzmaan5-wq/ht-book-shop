'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, UserCircle, Store, Receipt, Shield, ScrollText,
  Save, Eye, EyeOff, Lock, Mail, Building2, DollarSign,
  Clock, Percent, FileText, ToggleLeft, ToggleRight, BookOpen,
} from 'lucide-react';
import { apiClient as db } from '@/lib/apiClient';
import { useAuthStore } from '@/store';
import type { AuditLog } from '@/types';

// ── Tabs ────────────────────────────────────────────
type TabKey = 'profile' | 'store' | 'tax' | 'security' | 'audit';

const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'profile', label: 'Profile', icon: UserCircle },
  { key: 'store', label: 'Store Settings', icon: Store },
  { key: 'tax', label: 'Tax & Receipts', icon: Receipt },
  { key: 'security', label: 'Security', icon: Shield },
  { key: 'audit', label: 'Audit Log', icon: ScrollText },
];

// ── Toggle Component ────────────────────────────────
function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        {description && <p className="text-xs text-white/40 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className="relative shrink-0 focus:outline-none"
      >
        {checked ? (
          <ToggleRight className="w-10 h-10 text-indigo-400" />
        ) : (
          <ToggleLeft className="w-10 h-10 text-white/20" />
        )}
      </button>
    </div>
  );
}

// ── Input Component ─────────────────────────────────
function SettingsInput({
  label,
  value,
  onChange,
  icon: Icon,
  disabled,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  icon: React.ElementType;
  disabled?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-white/50 mb-1.5">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/25 transition-all ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        />
      </div>
    </div>
  );
}

// ── Motion variants ─────────────────────────────────
const pageVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};
const tabContent = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
};

export default function SettingsPage() {
  const { user, setAuth } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabKey>('profile');

  // ── Profile state ───────────────────────────────
  const [profileEdit, setProfileEdit] = useState(false);
  const [profileName, setProfileName] = useState(user?.name ?? '');
  const [profileEmail, setProfileEmail] = useState(user?.email ?? '');
  const [branchName, setBranchName] = useState<string>('All Branches');

  // ── Store Settings state ────────────────────────
  const [storeName, setStoreName] = useState('BookShop ERP');
  const [currency, setCurrency] = useState('LKR');
  const [timezone, setTimezone] = useState('Asia/Colombo');
  const [defaultTaxRate, setDefaultTaxRate] = useState('5');

  // ── Tax & Receipts state ────────────────────────
  const [taxPercent, setTaxPercent] = useState('5');
  const [receiptHeader, setReceiptHeader] = useState('BookShop ERP - Your Reading Destination');
  const [receiptFooter, setReceiptFooter] = useState('Thank you for shopping with us!');
  const [showLogo, setShowLogo] = useState(true);

  // ── Receipt custom formatting state ──────────────
  const [receiptTemplate, setReceiptTemplate] = useState('classic'); // classic, modern, elegant, retro
  const [receiptFont, setReceiptFont] = useState('mono'); // mono, sans, serif
  const [receiptFontSize, setReceiptFontSize] = useState('sm'); // xs, sm, md
  const [showBorder, setShowBorder] = useState(true);
  const [showSocials, setShowSocials] = useState(true);

  // ── Security state ──────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);

  // ── Audit Logs ──────────────────────────────────
  const [auditLogs, setAuditLogs] = useState<(AuditLog & { user?: any })[]>([]);

  const [saveMessage, setSaveMessage] = useState('');

  const loadSettings = useCallback(async () => {
    try {
      const settings = await db.getSettings();
      if (settings) {
        if (settings.storeName) setStoreName(settings.storeName);
        if (settings.currency) setCurrency(settings.currency);
        if (settings.timezone) setTimezone(settings.timezone);
        if (settings.defaultTaxRate) setDefaultTaxRate(settings.defaultTaxRate);
        if (settings.taxPercent) setTaxPercent(settings.taxPercent);
        if (settings.receiptHeader) setReceiptHeader(settings.receiptHeader);
        if (settings.receiptFooter) setReceiptFooter(settings.receiptFooter);
        if (settings.showLogo !== undefined) setShowLogo(settings.showLogo === 'true' || settings.showLogo === true);
        
        if (settings.receiptTemplate) setReceiptTemplate(settings.receiptTemplate);
        if (settings.receiptFont) setReceiptFont(settings.receiptFont);
        if (settings.receiptFontSize) setReceiptFontSize(settings.receiptFontSize);
        if (settings.showBorder !== undefined) setShowBorder(settings.showBorder === 'true' || settings.showBorder === true);
        if (settings.showSocials !== undefined) setShowSocials(settings.showSocials === 'true' || settings.showSocials === true);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  }, []);

  const loadAuditLogs = useCallback(async () => {
    try {
      const logs = await db.getAuditLogs();
      setAuditLogs(logs);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    }
  }, []);

  const loadBranch = useCallback(async () => {
    if (user?.branch_id) {
      try {
        const branch = await db.getBranch(user.branch_id);
        if (branch) setBranchName(branch.name);
      } catch (err) {
        console.error('Failed to load branch name:', err);
      }
    } else {
      setBranchName('All Branches');
    }
  }, [user]);

  // Load configuration
  useEffect(() => {
    loadSettings();
    loadAuditLogs();
    loadBranch();
  }, [loadSettings, loadAuditLogs, loadBranch]);

  // Real-time synchronization listener
  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail?.type === 'settings') {
        loadSettings();
      } else if (e.detail?.type === 'audit' || e.detail?.type === 'sales' || e.detail?.type === 'employees') {
        loadAuditLogs();
      }
    };
    window.addEventListener('db-update', handleUpdate);
    return () => window.removeEventListener('db-update', handleUpdate);
  }, [loadSettings, loadAuditLogs]);

  const handleSave = async () => {
    try {
      await db.updateSettings({
        storeName,
        currency,
        timezone,
        defaultTaxRate,
        taxPercent,
        receiptHeader,
        receiptFooter,
        showLogo,
        receiptTemplate,
        receiptFont,
        receiptFontSize,
        showBorder,
        showSocials,
      });

      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err: any) {
      console.error('Failed to save settings:', err);
      setSaveMessage(err.message || 'Error saving settings.');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      const updatedUser = await db.updateUserProfile(user.id, {
        name: profileName,
        email: profileEmail,
      });

      // Update local storage and store
      const currentToken = localStorage.getItem('token') || '';
      setAuth(updatedUser, currentToken);
      setProfileEdit(false);
      setSaveMessage('Profile updated successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setSaveMessage(err.message || 'Error updating profile.');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const handleUpdatePassword = async () => {
    if (!user) return;
    if (!newPassword || !confirmPassword) {
      setSaveMessage('Please enter new password.');
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }
    if (newPassword !== confirmPassword) {
      setSaveMessage('New passwords do not match.');
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }
    if (newPassword.length < 4) {
      setSaveMessage('Password must be at least 4 characters.');
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }

    try {
      // Fetch user to verify current password if they have set one
      const currentUser = await db.getUser(user.id);
      const userObj = currentUser as any;
      if (userObj && userObj.password_hash && userObj.password_hash !== '') {
        if (currentPassword !== userObj.password_hash) {
          setSaveMessage('Current password is incorrect.');
          setTimeout(() => setSaveMessage(''), 3000);
          return;
        }
      }

      await db.updateUserProfile(user.id, {
        name: user.name,
        email: user.email,
        password: newPassword,
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSaveMessage('Password updated successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err: any) {
      console.error('Failed to update password:', err);
      setSaveMessage(err.message || 'Error updating password.');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
            <Settings className="w-7 h-7 text-indigo-400" />
          </div>
          Settings
        </h1>
        <p className="text-white/50 mt-1">Manage your account and application preferences</p>
      </div>

      {/* Save success toast */}
      <AnimatePresence>
        {saveMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-6 right-6 z-50 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium shadow-2xl"
          >
            ✓ {saveMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:w-64 shrink-0">
          <div className="glass-card p-2 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 focus:outline-none ${
                    isActive
                      ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={tabContent}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {/* ── Profile Tab ──────────────── */}
              {activeTab === 'profile' && (
                <div className="glass-card p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">Profile Information</h2>
                    <button
                      onClick={() => setProfileEdit(!profileEdit)}
                      className="px-4 py-2 rounded-lg bg-white/5 text-sm text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      {profileEdit ? 'Cancel' : 'Edit'}
                    </button>
                  </div>

                  {/* Avatar */}
                  <div className="flex items-center gap-5">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-2xl font-bold text-white shadow-xl shadow-indigo-500/20">
                      {(user?.name ?? 'A').charAt(0)}
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-white">{user?.name ?? 'Admin'}</p>
                      <p className="text-sm text-white/40">{user?.role?.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()) ?? 'Super Admin'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SettingsInput label="Full Name" value={profileName} onChange={setProfileName} icon={UserCircle} disabled={!profileEdit} />
                    <SettingsInput label="Email Address" value={profileEmail} onChange={setProfileEmail} icon={Mail} disabled={!profileEdit} />
                    <SettingsInput label="Role" value={user?.role?.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()) ?? 'Super Admin'} onChange={() => {}} icon={Shield} disabled />
                    <SettingsInput label="Branch" value={branchName} onChange={() => {}} icon={Building2} disabled />
                  </div>

                  {profileEdit && (
                    <button
                      onClick={handleSaveProfile}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-sm font-medium text-white hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
                    >
                      <Save className="w-4 h-4" />
                      Save Changes
                    </button>
                  )}
                </div>
              )}

              {/* ── Store Settings Tab ────────── */}
              {activeTab === 'store' && (
                <div className="glass-card p-6 space-y-6">
                  <h2 className="text-lg font-semibold text-white">Store Settings</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SettingsInput label="Store Name" value={storeName} onChange={setStoreName} icon={Store} />
                    <SettingsInput label="Currency" value={currency} onChange={setCurrency} icon={DollarSign} />
                    <SettingsInput label="Timezone" value={timezone} onChange={setTimezone} icon={Clock} />
                    <SettingsInput label="Default Tax Rate (%)" value={defaultTaxRate} onChange={setDefaultTaxRate} icon={Percent} type="number" />
                  </div>
                  <button
                    onClick={handleSave}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-sm font-medium text-white hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                </div>
              )}

              {/* ── Tax & Receipts Tab ────────── */}
              {activeTab === 'tax' && (
                <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                  {/* Left Column: Customizers */}
                  <div className="xl:col-span-3 space-y-6">
                    <div className="glass-card p-6 space-y-6">
                      <h2 className="text-lg font-semibold text-white">Tax &amp; Receipts Customization</h2>
                      
                      {/* Configuration inputs */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <SettingsInput label="Tax Rate (%)" value={taxPercent} onChange={setTaxPercent} icon={Percent} type="number" />
                        <div>
                          <label className="block text-xs text-white/50 mb-1.5">Receipt Template Style</label>
                          <select
                            value={receiptTemplate}
                            onChange={(e) => setReceiptTemplate(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/25 transition-all"
                          >
                            <option value="classic" className="bg-[#12121A]">Classic (Terminal Monospace)</option>
                            <option value="modern" className="bg-[#12121A]">Modern (Sleek Clean)</option>
                            <option value="elegant" className="bg-[#12121A]">Elegant (Bookshop Serif)</option>
                            <option value="retro" className="bg-[#12121A]">Retro (Dotted Stamp)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-white/50 mb-1.5">Receipt Font Family</label>
                          <select
                            value={receiptFont}
                            onChange={(e) => setReceiptFont(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/25 transition-all"
                          >
                            <option value="mono" className="bg-[#12121A]">Monospaced</option>
                            <option value="sans" className="bg-[#12121A]">Sans-Serif</option>
                            <option value="serif" className="bg-[#12121A]">Serif</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-white/50 mb-1.5">Font Size Scale</label>
                          <select
                            value={receiptFontSize}
                            onChange={(e) => setReceiptFontSize(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/25 transition-all"
                          >
                            <option value="xs" className="bg-[#12121A]">Extra Small (xs)</option>
                            <option value="sm" className="bg-[#12121A]">Small (sm)</option>
                            <option value="md" className="bg-[#12121A]">Medium (md)</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <SettingsInput label="Receipt Header Text" value={receiptHeader} onChange={setReceiptHeader} icon={FileText} />
                        <SettingsInput label="Receipt Footer Text" value={receiptFooter} onChange={setReceiptFooter} icon={FileText} />
                      </div>

                      {/* Toggles */}
                      <div className="border-t border-white/5 pt-4 space-y-2">
                        <Toggle
                          checked={showLogo}
                          onChange={setShowLogo}
                          label="Show Logo on Receipts"
                          description="Display bookstore icon at the top of receipts"
                        />
                        <Toggle
                          checked={showBorder}
                          onChange={setShowBorder}
                          label="Show Double Paper Border"
                          description="Renders a realistic border around thermal receipts"
                        />
                        <Toggle
                          checked={showSocials}
                          onChange={setShowSocials}
                          label="Show Barcode &amp; Social Handle"
                          description="Appends a scannable transactional barcode mock to receipt bottom"
                        />
                      </div>

                      <button
                        onClick={handleSave}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-sm font-medium text-white hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
                      >
                        <Save className="w-4 h-4" />
                        Save Configurations
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Live Thermal Receipt Preview */}
                  <div className="xl:col-span-2 space-y-4">
                    <div className="flex flex-col items-center justify-center p-6 bg-white/5 rounded-2xl border border-white/10">
                      <p className="text-xs text-white/40 mb-4 uppercase tracking-wider font-semibold">Live Printed Receipt Preview</p>
                      
                      <div 
                        className={`w-full max-w-[320px] bg-[#FAF8F5] text-[#1C1917] p-6 shadow-2xl relative overflow-hidden select-none transition-all duration-300
                          ${showBorder ? 'border-4 border-double border-[#8B7E74]' : 'border-t border-b border-[#1C1917]/25'}
                          ${receiptFont === 'mono' ? 'font-mono' : receiptFont === 'serif' ? 'font-serif' : 'font-sans'}
                          ${receiptFontSize === 'xs' ? 'text-[10px]' : receiptFontSize === 'md' ? 'text-sm' : 'text-xs'}
                        `}
                        style={{
                          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 10px 10px -5px rgba(0, 0, 0, 0.6)',
                          backgroundImage: 'radial-gradient(#00000003 1px, transparent 0)',
                          backgroundSize: '8px 8px',
                        }}
                      >
                        {/* Jagged paper tear edges top */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-[#FAF8F5] flex overflow-hidden">
                          {Array.from({ length: 32 }).map((_, i) => (
                            <div key={i} className="w-2.5 h-2.5 bg-[#171720] rotate-45 -translate-y-1.5 shrink-0" />
                          ))}
                        </div>

                        {/* Receipt slip container */}
                        <div className="space-y-4 my-2">
                          {/* Logo element */}
                          {showLogo && (
                            <div className="flex flex-col items-center justify-center text-center">
                              <BookOpen className="w-8 h-8 text-[#1C1917]/80 mb-1" />
                            </div>
                          )}

                          {/* Header section */}
                          <div className="text-center space-y-1">
                            <h3 className="font-bold uppercase tracking-wide text-sm">{storeName}</h3>
                            <p className="opacity-80 italic text-center whitespace-pre-line leading-tight text-[11px]">{receiptHeader}</p>
                          </div>

                          {/* Divider 1 */}
                          <div className="text-center select-none font-bold opacity-60 overflow-hidden h-3">
                            {receiptTemplate === 'classic' && '--------------------------------'}
                            {receiptTemplate === 'modern' && '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'}
                            {receiptTemplate === 'elegant' && '❧ ~~~~~~~~~~~~~~~~~~~~~~~~~~~ ❧'}
                            {receiptTemplate === 'retro' && '................................'}
                          </div>

                          {/* Transaction metadata */}
                          <div className="space-y-0.5 leading-relaxed text-[11px]">
                            <div className="flex justify-between"><span>DATE:</span> <span>{new Date().toISOString().split('T')[0]} 22:34</span></div>
                            <div className="flex justify-between"><span>RECEIPT NO:</span> <span>#SALE-10948</span></div>
                            <div className="flex justify-between"><span>CASHIER:</span> <span>{user?.name ?? 'Employee'}</span></div>
                            <div className="flex justify-between"><span>BRANCH:</span> <span>{branchName}</span></div>
                          </div>

                          {/* Divider 2 */}
                          <div className="text-center select-none font-bold opacity-60 overflow-hidden h-3">
                            {receiptTemplate === 'classic' && '--------------------------------'}
                            {receiptTemplate === 'modern' && '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'}
                            {receiptTemplate === 'elegant' && '================================'}
                            {receiptTemplate === 'retro' && '................................'}
                          </div>

                          {/* Items listing */}
                          <div className="space-y-2 text-[11px]">
                            <div className="space-y-0.5">
                              <div className="flex justify-between font-semibold">
                                <span>Clean Code (Paperback)</span>
                                <span>Rs. 450.00</span>
                              </div>
                              <div className="flex justify-between text-[10px] opacity-70">
                                <span>1 unit x Rs. 450.00</span>
                                <span></span>
                              </div>
                            </div>
                            <div className="space-y-0.5">
                              <div className="flex justify-between font-semibold">
                                <span>The Hobbit (Hardcover)</span>
                                <span>Rs. 300.00</span>
                              </div>
                              <div className="flex justify-between text-[10px] opacity-70">
                                <span>2 units x Rs. 150.00</span>
                                <span></span>
                              </div>
                            </div>
                          </div>

                          {/* Divider 3 */}
                          <div className="text-center select-none font-bold opacity-60 overflow-hidden h-3">
                            {receiptTemplate === 'classic' && '--------------------------------'}
                            {receiptTemplate === 'modern' && '--------------------------------'}
                            {receiptTemplate === 'elegant' && '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~'}
                            {receiptTemplate === 'retro' && '................................'}
                          </div>

                          {/* Order totals calculation */}
                          <div className="space-y-1 text-right text-[11px]">
                            <div className="flex justify-between">
                              <span>SUBTOTAL:</span>
                              <span>Rs. 750.00</span>
                            </div>
                            <div className="flex justify-between text-[10px]">
                              <span>TAX ({taxPercent}%):</span>
                              <span>Rs. ${(750 * parseFloat(taxPercent || '5') / 100).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-xs border-t border-[#1C1917]/20 pt-1 mt-1">
                              <span>TOTAL:</span>
                              <span>Rs. ${(750 + (750 * parseFloat(taxPercent || '5') / 100)).toFixed(2)}</span>
                            </div>
                          </div>

                          {/* Divider 4 */}
                          <div className="text-center select-none font-bold opacity-60 overflow-hidden h-3">
                            {receiptTemplate === 'classic' && '--------------------------------'}
                            {receiptTemplate === 'modern' && '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'}
                            {receiptTemplate === 'elegant' && '================================'}
                            {receiptTemplate === 'retro' && '................................'}
                          </div>

                          {/* Footer message */}
                          <div className="text-center text-[10px]">
                            <p className="opacity-80 leading-tight whitespace-pre-line">{receiptFooter}</p>
                          </div>

                          {/* Barcode details */}
                          {showSocials && (
                            <div className="flex flex-col items-center justify-center pt-2 space-y-1 border-t border-dashed border-[#1C1917]/15">
                              {/* Simulated visual 1D Barcode with CSS lines */}
                              <div className="w-36 h-7 bg-transparent flex items-center justify-center gap-[1px] overflow-hidden">
                                {Array.from({ length: 30 }).map((_, i) => {
                                  const widths = ['w-[1px]', 'w-[2px]', 'w-[3px]'];
                                  const widthClass = widths[(i * 11 + 2) % widths.length];
                                  const isLine = (i * 7 + 1) % 5 !== 0;
                                  return (
                                    <div 
                                      key={i} 
                                      className={`h-full ${widthClass} ${isLine ? 'bg-[#1C1917]' : 'bg-transparent'}`} 
                                    />
                                  );
                                })}
                              </div>
                              <span className="text-[8px] font-mono tracking-widest opacity-60">109483017203</span>
                              <span className="text-[8px] tracking-wide opacity-50">@bookshop_erp</span>
                            </div>
                          )}
                        </div>

                        {/* Jagged paper tear edges bottom */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#FAF8F5] flex overflow-hidden">
                          {Array.from({ length: 32 }).map((_, i) => (
                            <div key={i} className="w-2.5 h-2.5 bg-[#171720] rotate-45 translate-y-1.5 shrink-0" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Security Tab ──────────────── */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  {/* Change Password */}
                  <div className="glass-card p-6 space-y-5">
                    <h2 className="text-lg font-semibold text-white">Change Password</h2>
                    <div className="grid grid-cols-1 gap-4 max-w-md">
                      <div>
                        <label className="block text-xs text-white/50 mb-1.5">Current Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/25 transition-all"
                            placeholder="Enter current password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 focus:outline-none"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <SettingsInput label="New Password" value={newPassword} onChange={setNewPassword} icon={Lock} type="password" />
                      <SettingsInput label="Confirm New Password" value={confirmPassword} onChange={setConfirmPassword} icon={Lock} type="password" />
                    </div>
                    <button
                      onClick={handleUpdatePassword}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-sm font-medium text-white hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
                    >
                      <Save className="w-4 h-4" />
                      Update Password
                    </button>
                  </div>

                  {/* 2FA & Sessions */}
                  <div className="glass-card p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-white">Security Options</h2>
                    <Toggle
                      checked={twoFactor}
                      onChange={setTwoFactor}
                      label="Two-Factor Authentication"
                      description="Add an extra layer of security to your account with TOTP"
                    />
                    <div className="border-t border-white/5 pt-4">
                      <h3 className="text-sm font-medium text-white mb-3">Active Sessions</h3>
                      <div className="space-y-3">
                        {[
                          { device: 'Windows PC — Chrome', ip: '192.168.1.1', time: 'Active now', current: true },
                          { device: 'iPhone 15 — Safari', ip: '192.168.1.45', time: '2 hours ago', current: false },
                        ].map((session, i) => (
                          <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/[0.02]">
                            <div>
                              <p className="text-sm text-white">{session.device}</p>
                              <p className="text-xs text-white/30">{session.ip} · {session.time}</p>
                            </div>
                            {session.current ? (
                              <span className="text-xs text-emerald-400 font-medium">Current</span>
                            ) : (
                              <button className="text-xs text-rose-400 hover:text-rose-300 font-medium focus:outline-none">
                                Revoke
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Audit Log Tab ─────────────── */}
              {activeTab === 'audit' && (
                <div className="glass-card p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">Audit Log</h2>
                    <span className="text-xs text-white/30">{auditLogs.length} entries</span>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-white/5">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-white/5">
                          {['User', 'Action', 'Entity', 'Details', 'IP Address', 'Timestamp'].map((h) => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-white/50 uppercase tracking-wider whitespace-nowrap">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {auditLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                                  {(log.user?.name ?? 'U').charAt(0)}
                                </div>
                                <span className="text-white/70 text-xs">{log.user?.name ?? 'Unknown'}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium ${
                                log.action.includes('LOGIN')
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : log.action.includes('Sale')
                                  ? 'bg-indigo-500/10 text-indigo-400'
                                  : log.action.includes('Transfer')
                                  ? 'bg-violet-500/10 text-violet-400'
                                  : 'bg-amber-500/10 text-amber-400'
                              }`}>
                                {log.action}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-white/50 text-xs whitespace-nowrap">{log.entity_type}</td>
                            <td className="px-4 py-3 text-white/50 text-xs max-w-[200px] truncate">{log.details}</td>
                            <td className="px-4 py-3 text-white/30 text-xs font-mono whitespace-nowrap">{log.ip_address}</td>
                            <td className="px-4 py-3 text-white/30 text-xs whitespace-nowrap">
                              {new Date(log.created_at).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
