'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiClient as db } from '@/lib/apiClient';
import { useAuthStore, useAppStore } from '@/store';


// ── Floating Orb ────────────────────────────────────
function FloatingOrb({
  size,
  color,
  x,
  y,
  delay,
}: {
  size: number;
  color: string;
  x: string;
  y: string;
  delay: number;
}) {
  return (
    <motion.div
      className="absolute rounded-full blur-3xl opacity-20 pointer-events-none"
      style={{
        width: size,
        height: size,
        background: color,
        left: x,
        top: y,
      }}
      animate={{
        x: [0, 30, -20, 0],
        y: [0, -40, 20, 0],
        scale: [1, 1.1, 0.95, 1],
      }}
      transition={{
        duration: 12,
        repeat: Infinity,
        repeatType: 'reverse',
        delay,
        ease: 'easeInOut',
      }}
    />
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const { setSelectedBranch } = useAppStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate network delay
    await new Promise((r) => setTimeout(r, 800));

    const user = await db.getUserByEmail(email);
    if (!user) {
      setError('No account found with this email address.');
      setLoading(false);
      return;
    }

    const userObj = user as any;
    if (userObj.password_hash && userObj.password_hash !== '') {
      if (password !== userObj.password_hash) {
        setError('Incorrect password.');
        setLoading(false);
        return;
      }
    } else {
      // Demo: accept any password for demo accounts if password_hash is not set yet
      if (password.length < 4) {
        setError('Password must be at least 4 characters.');
        setLoading(false);
        return;
      }
    }

    // Generate a mock token
    const token = `tok_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    setAuth(user, token);
    // Lock branch_manager and cashier to their assigned branch immediately
    if (user.role !== 'super_admin' && user.branch_id) {
      setSelectedBranch(user.branch_id);
    } else {
      setSelectedBranch(null);
    }
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-surface-0">
      {/* Animated gradient background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/80 via-surface-0 to-violet-950/60" />
        <div className="absolute inset-0 bg-grid opacity-30" />
      </div>

      {/* Floating orbs */}
      <FloatingOrb size={400} color="#4F46E5" x="10%" y="20%" delay={0} />
      <FloatingOrb size={300} color="#7C3AED" x="70%" y="10%" delay={2} />
      <FloatingOrb size={250} color="#8B5CF6" x="20%" y="70%" delay={4} />
      <FloatingOrb size={350} color="#6366F1" x="80%" y="60%" delay={1} />
      <FloatingOrb size={200} color="#A78BFA" x="50%" y="40%" delay={3} />

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl shadow-indigo-500/10">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-center mb-8"
          >
            <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-xl shadow-indigo-500/30 mb-4">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold gradient-text">BookShop ERP</h1>
            <p className="text-sm text-white/40 mt-1">Enterprise Management System</p>
          </motion.div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <label className="block text-xs text-white/50 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@bookshop.com"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
            </motion.div>

            {/* Password */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              <label className="block text-xs text-white/50 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-11 pr-11 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </motion.div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign In'
              )}
            </motion.button>
          </form>

          {/* Demo accounts */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="mt-6"
          >
            <p className="text-xs text-white/30 text-center mb-3">Demo Accounts</p>
            <div className="space-y-1.5">
              {[
                { label: 'Super Admin', email: 'admin@bookshop.com', color: 'text-indigo-400' },
                { label: 'Branch Manager (Downtown)', email: 'sarah@bookshop.com', color: 'text-emerald-400' },
                { label: 'Branch Manager (University)', email: 'james@bookshop.com', color: 'text-emerald-400' },
                { label: 'Cashier (Downtown)', email: 'mike@bookshop.com', color: 'text-amber-400' },
              ].map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => { setEmail(acc.email); setPassword('password'); }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors group"
                >
                  <span className={`text-xs font-medium ${acc.color}`}>{acc.label}</span>
                  <span className="text-[11px] text-white/30 group-hover:text-white/50 transition-colors">{acc.email}</span>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-white/20 text-center mt-2">Password: <span className="text-white/35">password</span></p>
          </motion.div>
        </div>

        {/* Bottom text */}
        <p className="text-center text-[11px] text-white/20 mt-6">
          © 2026 BookShop ERP. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
}
