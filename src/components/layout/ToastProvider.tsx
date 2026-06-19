'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { useToastStore, useNotificationStore, useAuthStore } from '@/store';
import apiClient from '@/lib/apiClient';

const icons = {
  success: CheckCircle,
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
};

const colors = {
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  info: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  error: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
};

export default function ToastProvider() {
  const { toasts, removeToast, addToast } = useToastStore();
  const { user } = useAuthStore();
  const { setNotifications } = useNotificationStore();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Connect to WebSocket Broadcast server on port 3001
    const socketUrl = `http://${window.location.hostname}:3001`;
    console.log(`[WebSocket] Connecting to ${socketUrl}...`);
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('[WebSocket] Connected successfully to broadcast server.');
    });

    socket.on('connect_error', () => {
      console.warn('[WebSocket] Connection failed. Alerts running in local mock fallback.');
    });

    // Sales Alert
    socket.on('sales:created', (data) => {
      // Don't show toast to the cashier who made the sale (they already got a success dialog)
      if (user?.id !== data.sale.cashier_id) {
        addToast({
          type: 'success',
          title: 'New Sale Logged',
          message: `Sale completed: Rs. ${data.sale.total.toFixed(2)} (${data.sale.payment_method})`,
        });
      }
      // Broadcast local event to force data reload on active pages
      window.dispatchEvent(new CustomEvent('db-update', { detail: { type: 'sales' } }));
    });

    // Inventory Updates
    socket.on('inventory:updated', () => {
      // Refetch page data
      window.dispatchEvent(new CustomEvent('db-update', { detail: { type: 'inventory' } }));
    });

    // Stock Transfers Alert
    socket.on('transfers:updated', () => {
      addToast({
        type: 'warning',
        title: 'Stock Transfer Activity',
        message: 'A stock transfer request has been modified or created.',
      });
      window.dispatchEvent(new CustomEvent('db-update', { detail: { type: 'transfers' } }));
    });

    // Notifications refresh
    socket.on('notifications:updated', () => {
      if (user?.id) {
        apiClient.getNotifications(user.id).then(notifs => {
          setNotifications(notifs);
        });
      }
      window.dispatchEvent(new CustomEvent('db-update', { detail: { type: 'notifications' } }));
    });

    // Employee status
    socket.on('employees:updated', () => {
      window.dispatchEvent(new CustomEvent('db-update', { detail: { type: 'employees' } }));
    });

    // Settings changed
    socket.on('settings:updated', () => {
      addToast({
        type: 'info',
        title: 'System Settings Updated',
        message: 'A system configuration settings change was synchronized.',
      });
      window.dispatchEvent(new CustomEvent('db-update', { detail: { type: 'settings' } }));
    });

    return () => {
      socket.disconnect();
    };
  }, [addToast, user, setNotifications]);

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = icons[toast.type];
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
              layout
              className={`
                pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl shadow-2xl
                ${colors[toast.type]}
              `}
            >
              <Icon className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-tight text-white">{toast.title}</p>
                <p className="text-xs text-white/70 mt-1 leading-normal">{toast.message}</p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-white/40 hover:text-white transition-colors p-0.5 rounded-lg hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
