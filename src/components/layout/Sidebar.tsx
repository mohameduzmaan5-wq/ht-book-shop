'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  GitBranch,
  Users,
  Users2,
  BarChart3,
  FileText,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Store,
  Sun,
  Moon,
  BookOpen,
  ChevronsUpDown,
  Check,
  Truck,
} from 'lucide-react';
import { useAppStore, useAuthStore, useNotificationStore } from '@/store';
import { apiClient as db } from '@/lib/apiClient';
import type { UserRole } from '@/types';

// ─── Role-based Nav ───────────────────────────────────
const allNavItems = [
  { label: 'Dashboard',     href: '/dashboard',     icon: LayoutDashboard, roles: ['super_admin', 'branch_manager', 'cashier'] },
  { label: 'POS',           href: '/pos',            icon: ShoppingCart,    roles: ['super_admin', 'branch_manager', 'cashier'] },
  { label: 'Inventory',     href: '/inventory',      icon: Package,         roles: ['super_admin', 'branch_manager', 'cashier'] },
  { label: 'Suppliers',     href: '/suppliers',      icon: Truck,           roles: ['super_admin', 'branch_manager'] },
  { label: 'Branches',      href: '/branches',       icon: GitBranch,       roles: ['super_admin'] },
  { label: 'Employees',     href: '/employees',      icon: Users,           roles: ['super_admin', 'branch_manager'] },
  { label: 'Customers',     href: '/customers',      icon: Users2,          roles: ['super_admin', 'branch_manager', 'cashier'] },
  { label: 'Analytics',     href: '/analytics',      icon: BarChart3,       roles: ['super_admin', 'branch_manager'] },
  { label: 'Reports',       href: '/reports',        icon: FileText,        roles: ['super_admin', 'branch_manager'] },
  { label: 'Notifications', href: '/notifications',  icon: Bell,            roles: ['super_admin', 'branch_manager', 'cashier'] },
  { label: 'Settings',      href: '/settings',       icon: Settings,        roles: ['super_admin', 'branch_manager'] },
];

// ─── Animation Variants ──────────────────────────────
const sidebarVariants = {
  expanded: { width: 260 },
  collapsed: { width: 72 },
};

const overlayVariants  = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const mobileMenuVariants = { hidden: { x: -280 }, visible: { x: 0 } };
const dropdownVariants = {
  hidden:  { opacity: 0, y: -8, scale: 0.95 },
  visible: { opacity: 1, y: 0,  scale: 1 },
};

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar, selectedBranch, setSelectedBranch, theme, toggleTheme } =
    useAppStore();
  const { user, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();

  const [branches, setBranches]               = useState<{ id: string; name: string }[]>([]);
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [isMobile, setIsMobile]               = useState(false);
  const [mobileOpen, setMobileOpen]           = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const role: UserRole = (user?.role as UserRole) ?? 'cashier';
  const isSuperAdmin   = role === 'super_admin';
  const isExpanded     = isMobile ? true : sidebarOpen;

  const navItems = allNavItems.filter((item) => item.roles.includes(role));

  // Load branches from DB for super_admin branch switcher
  useEffect(() => {
    if (!isSuperAdmin) return;
    db.getBranches().then((rows: any[]) => {
      setBranches(rows.map((b: any) => ({ id: b.id, name: b.name })));
    }).catch(() => {});
  }, [isSuperAdmin]);

  // Responsive detection
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Close branch dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setBranchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const currentBranchName = isSuperAdmin
    ? (branches.find((b) => b.id === selectedBranch)?.name ?? 'All Branches')
    : (user?.branch_id
        ? (branches.find((b) => b.id === user.branch_id)?.name ?? user.branch_id)
        : '');

  // ─── Sidebar Content ──────────────────────────────
  const sidebarContent = (
    <div className="flex h-full flex-col bg-[#0A0A0F] border-r border-white/5">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 shrink-0 border-b border-white/5">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25 shrink-0">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        <AnimatePresence>
          {isExpanded && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="text-base font-bold tracking-tight whitespace-nowrap overflow-hidden"
            >
              <span className="gradient-text">BookShop</span>{' '}
              <span className="text-white/60 font-medium">ERP</span>
            </motion.span>
          )}
        </AnimatePresence>

        {!isMobile && (
          <button
            onClick={toggleSidebar}
            className="ml-auto p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white/80 transition-colors"
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Branch Switcher — super_admin only */}
      {isSuperAdmin && (
        <div className="px-3 pt-4 pb-2" ref={dropdownRef}>
          <button
            onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
            className={`
              w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5
              bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06]
              transition-all duration-200 group
              ${!isExpanded ? 'justify-center' : ''}
            `}
          >
            <Store className="w-4 h-4 text-indigo-400 shrink-0" />
            {isExpanded && (
              <>
                <span className="text-sm text-white/70 truncate flex-1 text-left">
                  {currentBranchName}
                </span>
                <ChevronsUpDown className="w-3.5 h-3.5 text-white/30 group-hover:text-white/60 shrink-0" />
              </>
            )}
          </button>

          <AnimatePresence>
            {branchDropdownOpen && isExpanded && (
              <motion.div
                variants={dropdownVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="mt-1.5 py-1 rounded-xl bg-[#12121A] border border-white/[0.08] shadow-2xl shadow-black/50 overflow-hidden z-50 relative"
              >
                <button
                  onClick={() => { setSelectedBranch(null); setBranchDropdownOpen(false); }}
                  className={`
                    w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors
                    ${selectedBranch === null ? 'text-indigo-400 bg-indigo-500/10' : 'text-white/60 hover:text-white hover:bg-white/5'}
                  `}
                >
                  <GitBranch className="w-3.5 h-3.5 shrink-0" />
                  <span className="flex-1 text-left">All Branches</span>
                  {selectedBranch === null && <Check className="w-3.5 h-3.5" />}
                </button>

                <div className="h-px bg-white/[0.06] mx-2 my-1" />

                {branches.map((branch) => (
                  <button
                    key={branch.id}
                    onClick={() => { setSelectedBranch(branch.id); setBranchDropdownOpen(false); }}
                    className={`
                      w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors
                      ${selectedBranch === branch.id ? 'text-indigo-400 bg-indigo-500/10' : 'text-white/60 hover:text-white hover:bg-white/5'}
                    `}
                  >
                    <Store className="w-3.5 h-3.5 shrink-0" />
                    <span className="flex-1 text-left truncate">{branch.name}</span>
                    {selectedBranch === branch.id && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Branch label for non-admin (read-only) */}
      {!isSuperAdmin && user?.branch_id && isExpanded && (
        <div className="px-3 pt-4 pb-2">
          <div className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 bg-indigo-500/[0.07] border border-indigo-500/20">
            <Store className="w-4 h-4 text-indigo-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-indigo-300/70 font-medium">Your Branch</p>
              <p className="text-sm text-indigo-300 truncate font-semibold">{currentBranchName || user.branch_id}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => isMobile && setMobileOpen(false)}
              className={`
                group relative flex items-center gap-3 rounded-xl px-3 py-2.5
                transition-all duration-200
                ${isActive
                  ? 'bg-white/[0.07] text-white shadow-sm'
                  : 'text-white/50 hover:text-white/90 hover:bg-white/[0.04]'
                }
                ${!isExpanded ? 'justify-center' : ''}
              `}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b from-indigo-400 to-purple-500"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}

              <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'text-indigo-400' : ''}`} />

              <AnimatePresence>
                {isExpanded && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.15 }}
                    className="text-[13px] font-medium whitespace-nowrap overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {item.label === 'Notifications' && unreadCount > 0 && (
                <span
                  className={`
                    flex items-center justify-center text-[10px] font-bold text-white
                    bg-rose-500 shadow-lg shadow-rose-500/30
                    ${isExpanded
                      ? 'ml-auto px-1.5 min-w-[18px] h-[18px] rounded-full'
                      : 'absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[9px]'
                    }
                  `}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}

              {!isExpanded && !isMobile && (
                <div className="absolute left-full ml-2 px-2.5 py-1.5 rounded-lg bg-[#1A1A2E] border border-white/10 text-xs text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-xl">
                  {item.label}
                  {item.label === 'Notifications' && unreadCount > 0 && (
                    <span className="ml-1.5 text-rose-400">({unreadCount})</span>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="shrink-0 border-t border-white/5 p-3 space-y-2">
        <button
          onClick={toggleTheme}
          className={`
            w-full flex items-center gap-3 rounded-xl px-3 py-2.5
            text-white/50 hover:text-white/90 hover:bg-white/[0.04]
            transition-all duration-200
            ${!isExpanded ? 'justify-center' : ''}
          `}
        >
          {theme === 'dark' ? (
            <Sun className="w-[18px] h-[18px] shrink-0 text-amber-400" />
          ) : (
            <Moon className="w-[18px] h-[18px] shrink-0 text-indigo-400" />
          )}
          <AnimatePresence>
            {isExpanded && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
                className="text-[13px] font-medium whitespace-nowrap overflow-hidden"
              >
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* User Info */}
        <div
          className={`
            flex items-center gap-3 rounded-xl px-3 py-2.5
            bg-white/[0.03] border border-white/[0.06]
            ${!isExpanded ? 'justify-center' : ''}
          `}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-md shadow-indigo-500/20">
            {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
          </div>
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
                className="flex-1 min-w-0 overflow-hidden"
              >
                <p className="text-sm font-medium text-white truncate">{user?.name ?? 'User'}</p>
                <p className="text-[11px] text-white/40 capitalize truncate">
                  {user?.role?.replace(/_/g, ' ') ?? 'Role'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          {isExpanded && (
            <button
              onClick={logout}
              className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-rose-400 transition-colors shrink-0"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // ─── Mobile Overlay ────────────────────────────────
  if (isMobile) {
    return (
      <>
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                variants={overlayVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                onClick={() => setMobileOpen(false)}
              />
              <motion.aside
                variants={mobileMenuVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed left-0 top-0 bottom-0 w-[260px] z-50 shadow-2xl shadow-black/50"
              >
                {sidebarContent}
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  // ─── Desktop Sidebar ───────────────────────────────
  return (
    <motion.aside
      variants={sidebarVariants}
      animate={sidebarOpen ? 'expanded' : 'collapsed'}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="relative h-screen shrink-0 hidden md:block"
    >
      {sidebarContent}
    </motion.aside>
  );
}

export function useMobileSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  return { mobileOpen, setMobileOpen, toggleMobile: () => setMobileOpen((v) => !v) };
}
