'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BookOpen, Loader2 } from 'lucide-react';

export default function RootPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const userRaw = localStorage.getItem('user');
        if (userRaw) {
          const user = JSON.parse(userRaw);
          if (user?.id) {
            router.replace('/dashboard');
            return;
          }
        }
      } catch {
        // Invalid data — go to login
      }
      router.replace('/login');
      setChecking(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [router]);

  if (!checking) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-0 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/50 via-surface-0 to-violet-950/30" />
      <div className="absolute inset-0 bg-grid opacity-20" />

      {/* Loading content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative z-10 flex flex-col items-center gap-6"
      >
        {/* Logo */}
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="p-5 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-2xl shadow-indigo-500/30"
        >
          <BookOpen className="w-10 h-10 text-white" />
        </motion.div>

        <div className="text-center">
          <h1 className="text-2xl font-bold gradient-text">BookShop ERP</h1>
          <p className="text-sm text-white/30 mt-1">Enterprise Management System</p>
        </div>

        {/* Spinner */}
        <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
      </motion.div>
    </div>
  );
}
