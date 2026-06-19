'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import ToastProvider from '@/components/layout/ToastProvider';
import { useAuthStore, useAppStore } from '@/store';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, user, setAuth, logout } = useAuthStore();
  const { theme } = useAppStore();

  // Rehydrate auth state on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');

    if (token && userJson) {
      try {
        const userData = JSON.parse(userJson);
        setAuth(userData, token);
        // Enforce branch isolation: branch_manager and cashier are locked to their branch
        if (userData.role !== 'super_admin' && userData.branch_id) {
          useAppStore.getState().setSelectedBranch(userData.branch_id);
        }
      } catch (e) {
        logout();
        router.push('/login');
      }
    } else {
      router.push('/login');
    }
  }, [setAuth, logout, router]);

  // Protect route
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token && !isLoading) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0F] text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <p className="text-sm font-medium text-white/50">Verifying session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#07070B] text-white select-none">
      {/* Real-time Toast Alert Provider */}
      <ToastProvider />

      {/* Sidebar navigation */}
      <Sidebar />


      {/* Main app body */}
      <div className="flex h-full flex-1 flex-col overflow-hidden">
        {/* Header bar */}
        <Header />

        {/* Scrollable content area */}
        <main className="relative flex-1 overflow-y-auto bg-transparent p-6 focus:outline-none">
          {/* Subtle grid pattern background */}
          <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />

          {/* Stagger page transitions */}
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="relative z-10 h-full w-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
