import { create } from 'zustand';
import type { User, Notification, CartItem, Book } from '@/types';

// ============================================
// Auth Store
// ============================================
interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  setAuth: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    }
    set({ user, token, isAuthenticated: true, isLoading: false });
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },
  setLoading: (loading) => set({ isLoading: loading }),
}));

// ============================================
// App Store (UI State)
// ============================================
interface AppStore {
  selectedBranch: string | null;
  setSelectedBranch: (branchId: string | null) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  selectedBranch: null,
  setSelectedBranch: (branchId) => {
    if (typeof window !== 'undefined' && branchId) {
      localStorage.setItem('selectedBranch', branchId);
    }
    set({ selectedBranch: branchId });
  },
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  theme: 'dark',
  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme);
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
    set({ theme });
  },
  toggleTheme: () =>
    set((state) => {
      const newTheme = state.theme === 'dark' ? 'light' : 'dark';
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
      }
      return { theme: newTheme };
    }),
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
}));

// ============================================
// Notification Store
// ============================================
interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  unreadCount: 0,
  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.is_read).length,
    }),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + (notification.is_read ? 0 : 1),
    })),
  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, is_read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),
  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
      unreadCount: 0,
    })),
  clearAll: () => set({ notifications: [], unreadCount: 0 }),
}));

// ============================================
// POS / Cart Store
// ============================================
interface CartStore {
  items: CartItem[];
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  taxRate: number;
  paymentMethod: 'cash' | 'card' | 'mobile' | 'credit';
  notes: string;
  amountPaid: number;
  addItem: (book: Book, branchId: string, availableQty: number) => void;
  removeItem: (bookId: string) => void;
  updateQuantity: (bookId: string, quantity: number) => void;
  updateItemDiscount: (bookId: string, discount: number) => void;
  setCustomerName: (name: string) => void;
  setCustomerEmail: (email: string) => void;
  setCustomerPhone: (phone: string) => void;
  setDiscountType: (type: 'percentage' | 'flat') => void;
  setDiscountValue: (value: number) => void;
  setTaxRate: (rate: number) => void;
  setPaymentMethod: (method: 'cash' | 'card' | 'mobile' | 'credit') => void;
  setNotes: (notes: string) => void;
  setAmountPaid: (amount: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getDiscountAmount: () => number;
  getTaxAmount: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  discountType: 'percentage',
  discountValue: 0,
  taxRate: 5,
  paymentMethod: 'cash',
  notes: '',
  amountPaid: 0,

  addItem: (book, branchId, availableQty) =>
    set((state) => {
      const existing = state.items.find((item) => item.book.id === book.id);
      if (existing) {
        return {
          items: state.items.map((item) =>
            item.book.id === book.id
              ? { ...item, quantity: Math.min(item.quantity + 1, item.available_quantity) }
              : item
          ),
        };
      }
      return {
        items: [
          ...state.items,
          {
            book,
            quantity: 1,
            unit_price: book.selling_price,
            discount: 0,
            branch_id: branchId,
            available_quantity: availableQty,
          },
        ],
      };
    }),

  removeItem: (bookId) =>
    set((state) => ({
      items: state.items.filter((item) => item.book.id !== bookId),
    })),

  updateQuantity: (bookId, quantity) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.book.id === bookId
          ? { ...item, quantity: Math.max(1, Math.min(quantity, item.available_quantity)) }
          : item
      ),
    })),

  updateItemDiscount: (bookId, discount) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.book.id === bookId ? { ...item, discount } : item
      ),
    })),

  setCustomerName: (name) => set({ customerName: name }),
  setCustomerEmail: (email) => set({ customerEmail: email }),
  setCustomerPhone: (phone) => set({ customerPhone: phone }),
  setDiscountType: (type) => set({ discountType: type }),
  setDiscountValue: (value) => set({ discountValue: value }),
  setTaxRate: (rate) => set({ taxRate: rate }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setNotes: (notes) => set({ notes }),
  setAmountPaid: (amount) => set({ amountPaid: amount }),

  clearCart: () =>
    set({
      items: [],
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      discountType: 'percentage',
      discountValue: 0,
      notes: '',
      paymentMethod: 'cash',
      amountPaid: 0,
    }),


  getSubtotal: () => {
    return get().items.reduce((sum, item) => {
      const itemTotal = item.unit_price * item.quantity;
      return sum + itemTotal - item.discount;
    }, 0);
  },

  getDiscountAmount: () => {
    const { discountType, discountValue } = get();
    const subtotal = get().getSubtotal();
    if (discountType === 'percentage') {
      return (subtotal * discountValue) / 100;
    }
    return discountValue;
  },

  getTaxAmount: () => {
    const subtotal = get().getSubtotal();
    const discount = get().getDiscountAmount();
    return ((subtotal - discount) * get().taxRate) / 100;
  },

  getTotal: () => {
    const subtotal = get().getSubtotal();
    const discount = get().getDiscountAmount();
    const tax = get().getTaxAmount();
    return subtotal - discount + tax;
  },
}));

// ============================================
// Toast Notification Store
// ============================================
export interface Toast {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  duration?: number;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newToast = { ...toast, id };
    
    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    // Auto remove after duration or 4s
    const duration = toast.duration || 4000;
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, duration);
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

