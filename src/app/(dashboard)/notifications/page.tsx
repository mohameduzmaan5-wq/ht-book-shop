'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, CheckCheck, AlertTriangle, ShoppingCart, Target,
  User, ArrowLeftRight, Info, Inbox,
} from 'lucide-react';
import { apiClient as db } from '@/lib/apiClient';
import { useAuthStore, useNotificationStore } from '@/store';
import type { NotificationType } from '@/types';

// ── Type config ─────────────────────────────────────
const typeConfig: Record<
  NotificationType,
  { icon: React.ElementType; color: string; bg: string; border: string; label: string }
> = {
  low_stock: {
    icon: AlertTriangle,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    label: 'Low Stock',
  },
  new_sale: {
    icon: ShoppingCart,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    label: 'Sales',
  },
  target_reached: {
    icon: Target,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20',
    label: 'Targets',
  },
  employee_login: {
    icon: User,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    label: 'Employees',
  },
  stock_transfer: {
    icon: ArrowLeftRight,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    label: 'Transfers',
  },
  system: {
    icon: Info,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    label: 'System',
  },
};

type FilterKey = 'all' | 'unread' | NotificationType;

const filters: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'low_stock', label: 'Low Stock' },
  { key: 'new_sale', label: 'Sales' },
  { key: 'stock_transfer', label: 'Transfers' },
  { key: 'system', label: 'System' },
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

// ── Motion variants ─────────────────────────────────
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, x: -16 },
  show: { opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] } },
  exit: { opacity: 0, x: 16, transition: { duration: 0.2 } },
};

export default function NotificationsPage() {
  const { user } = useAuthStore();
  const { notifications, setNotifications, markAsRead, markAllAsRead, unreadCount } =
    useNotificationStore();
  const [filter, setFilter] = useState<FilterKey>('all');
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const notifs = await db.getNotifications(user.id);
      setNotifications(notifs);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [user, setNotifications]);

  // Load notifications
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Real-time listener
  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail?.type === 'notifications') {
        fetchNotifications();
      }
    };
    window.addEventListener('db-update', handleUpdate);
    return () => window.removeEventListener('db-update', handleUpdate);
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await db.updateNotification(id, true);
      markAsRead(id);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    try {
      await db.markAllNotificationsRead(user.id);
      markAllAsRead();
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  // Filtered list
  const filtered = useMemo(() => {
    if (filter === 'all') return notifications;
    if (filter === 'unread') return notifications.filter((n) => !n.is_read);
    return notifications.filter((n) => n.type === filter);
  }, [notifications, filter]);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6 max-w-4xl"
    >
      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 relative">
              <Bell className="w-7 h-7 text-indigo-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            Notifications
          </h1>
          <p className="text-white/50 mt-1">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium hover:bg-indigo-500/20 transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            Mark All Read
          </button>
        )}
      </motion.div>

      {/* Filter Pills */}
      <motion.div variants={item} className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              filter === f.key
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </motion.div>

      {/* Notification List */}
      <AnimatePresence mode="popLayout">
        {filtered.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-12 flex flex-col items-center justify-center text-center"
          >
            <div className="p-4 rounded-2xl bg-white/5 mb-4">
              <Inbox className="w-12 h-12 text-white/20" />
            </div>
            <h3 className="text-lg font-semibold text-white/60 mb-1">No notifications</h3>
            <p className="text-sm text-white/30">
              {filter === 'all'
                ? "You're all caught up! No notifications to show."
                : `No ${filter === 'unread' ? 'unread' : filters.find((f) => f.key === filter)?.label?.toLowerCase()} notifications.`}
            </p>
          </motion.div>
        ) : (
          <motion.div className="space-y-3" variants={container} initial="hidden" animate="show">
            {filtered.map((notif) => {
              const config = typeConfig[notif.type];
              const Icon = config.icon;
              return (
                <motion.div
                  key={notif.id}
                  variants={item}
                  layout
                  onClick={() => {
                    if (!notif.is_read) handleMarkAsRead(notif.id);
                  }}
                  className={`glass-card p-5 flex items-start gap-4 cursor-pointer transition-all duration-200 hover:bg-white/[0.04] ${
                    !notif.is_read ? 'border-l-2 border-l-indigo-500' : ''
                  }`}
                >
                  {/* Icon */}
                  <div className={`p-2.5 rounded-xl ${config.bg} border ${config.border} shrink-0`}>
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className={`text-sm font-semibold ${!notif.is_read ? 'text-white' : 'text-white/70'}`}>
                          {notif.title}
                        </h3>
                        <p className={`text-sm mt-0.5 ${!notif.is_read ? 'text-white/60' : 'text-white/40'}`}>
                          {notif.message}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-white/30">{timeAgo(notif.created_at)}</span>
                        {!notif.is_read && (
                          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/50" />
                        )}
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium ${config.bg} ${config.color}`}>
                        {config.label}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
