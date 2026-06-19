'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Bell,
  Menu,
  Command,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Store,
  X,
  Clock,
} from 'lucide-react';
import { useAppStore, useAuthStore, useNotificationStore } from '@/store';

const dropdownVariants = {
  hidden: { opacity: 0, y: -8, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

const branches: Record<string, string> = {
  branch_001: 'Downtown Flagship',
  branch_002: 'University District',
  branch_003: 'Westside Mall',
};

interface HeaderProps {
  onMobileMenuToggle?: () => void;
}

export default function Header({ onMobileMenuToggle }: HeaderProps) {
  const { searchQuery, setSearchQuery, selectedBranch, toggleSidebar } = useAppStore();
  const { user, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Live clock
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Cmd+K / Ctrl+K shortcut to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape') {
        searchRef.current?.blur();
        setSearchFocused(false);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const branchName = selectedBranch ? branches[selectedBranch] : null;

  return (
    <header className="sticky top-0 z-30 flex items-center h-16 px-4 md:px-6 border-b border-white/5 bg-[#0A0A0F]/80 backdrop-blur-xl">
      {/* Mobile Menu Toggle */}
      <button
        onClick={onMobileMenuToggle ?? toggleSidebar}
        className="md:hidden p-2 -ml-1 mr-2 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-colors"
        aria-label="Toggle menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Search Bar */}
      <div className="relative flex-1 max-w-md">
        <div
          className={`
            flex items-center gap-2.5 rounded-xl px-3.5 py-2
            border transition-all duration-200
            ${searchFocused
              ? 'bg-white/[0.06] border-indigo-500/40 shadow-lg shadow-indigo-500/5'
              : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.05]'
            }
          `}
        >
          <Search className={`w-4 h-4 shrink-0 transition-colors ${searchFocused ? 'text-indigo-400' : 'text-white/30'}`} />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search books, orders, employees…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="p-0.5 rounded text-white/30 hover:text-white/60 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white/[0.06] border border-white/[0.08] text-[10px] font-medium text-white/30">
              <Command className="w-2.5 h-2.5" />K
            </kbd>
          )}
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2 ml-4">
        {/* Live Clock */}
        <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-xs font-mono text-white/40">
          <Clock className="w-3 h-3" />
          <span>{currentTime}</span>
        </div>

        {/* Branch Indicator */}
        {branchName && (
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium text-indigo-400">
            <Store className="w-3 h-3" />
            <span className="max-w-[120px] truncate">{branchName}</span>
          </div>
        )}

        {/* Notification Bell */}
        <Link href="/notifications" className="relative p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-colors">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-lg shadow-rose-500/40">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* Separator */}
        <div className="hidden sm:block w-px h-6 bg-white/[0.06]" />

        {/* User Dropdown */}
        <div ref={userMenuRef} className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl hover:bg-white/5 transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-md shadow-indigo-500/20">
              {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-white leading-tight">{user?.name ?? 'User'}</p>
              <p className="text-[11px] text-white/40 capitalize leading-tight">
                {user?.role?.replace('_', ' ') ?? 'Role'}
              </p>
            </div>
            <ChevronDown className="hidden sm:block w-3.5 h-3.5 text-white/30 group-hover:text-white/60 transition-colors" />
          </button>

          <AnimatePresence>
            {userMenuOpen && (
              <motion.div
                variants={dropdownVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute right-0 top-full mt-2 w-56 py-1.5 rounded-xl bg-[#12121A] border border-white/[0.08] shadow-2xl shadow-black/60 z-50"
              >
                {/* User header in dropdown */}
                <div className="px-3 py-2.5 border-b border-white/[0.06]">
                  <p className="text-sm font-medium text-white">{user?.name ?? 'User'}</p>
                  <p className="text-xs text-white/40 mt-0.5">{user?.email ?? 'user@example.com'}</p>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => setUserMenuOpen(false)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </button>
                  <button
                    onClick={() => setUserMenuOpen(false)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                </div>

                <div className="border-t border-white/[0.06] pt-1">
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-rose-400/80 hover:text-rose-400 hover:bg-rose-500/5 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
