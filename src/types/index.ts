// ============================================
// Bookshop ERP - Core TypeScript Types
// ============================================

// --- User & Auth ---
export type UserRole = 'super_admin' | 'branch_manager' | 'cashier';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  branch_id: string | null;
  avatar?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// --- Branch ---
export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  manager_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Computed
  total_books?: number;
  total_sales_today?: number;
  revenue_today?: number;
  employee_count?: number;
}

// --- Book ---
export interface Book {
  id: string;
  isbn: string;
  barcode: string;
  title: string;
  author: string;
  publisher: string;
  category: string;
  description: string;
  cost_price: number;
  selling_price: number;
  image_url: string;
  created_at: string;
  updated_at: string;
}

export interface BranchInventory {
  id: string;
  book_id: string;
  branch_id: string;
  quantity: number;
  reorder_level: number;
  last_restocked: string;
  // Joined
  book?: Book;
  branch?: Branch;
}

export interface InventoryItem extends Book {
  quantity: number;
  reorder_level: number;
  branch_id: string;
  inventory_id: string;
}

// --- Sales ---
export interface Sale {
  id: string;
  branch_id: string;
  cashier_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  subtotal: number;
  discount_amount: number;
  discount_type: 'percentage' | 'flat';
  tax_amount: number;
  total: number;
  payment_method: 'cash' | 'card' | 'mobile' | 'credit';
  status: 'completed' | 'refunded' | 'partial_refund';
  notes: string;
  amount_paid?: number;
  amount_due?: number;
  payment_status?: 'paid' | 'unpaid' | 'partial';
  created_at: string;
  // Joined
  items?: SaleItem[];
  cashier?: User;
  branch?: Branch;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  book_id: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
  // Joined
  book?: Book;
}

export interface CartItem {
  book: Book;
  quantity: number;
  unit_price: number;
  discount: number;
  branch_id: string;
  available_quantity: number;
}

// --- Stock Transfer ---
export interface StockTransfer {
  id: string;
  book_id: string;
  from_branch_id: string;
  to_branch_id: string;
  quantity: number;
  status: 'pending' | 'approved' | 'completed' | 'rejected';
  requested_by: string;
  approved_by: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
  // Joined
  book?: Book;
  from_branch?: Branch;
  to_branch?: Branch;
  requester?: User;
  approver?: User | null;
}

// --- Expenses ---
export interface Expense {
  id: string;
  branch_id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  created_by: string;
  created_at: string;
}

// --- Notifications ---
export type NotificationType =
  | 'low_stock'
  | 'new_sale'
  | 'target_reached'
  | 'employee_login'
  | 'stock_transfer'
  | 'system';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  metadata: string;
  created_at: string;
}

// --- Audit Log ---
export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: string;
  ip_address: string;
  created_at: string;
  user?: User;
}

// --- Analytics ---
export interface DashboardStats {
  totalRevenue: number;
  totalSales: number;
  totalBooks: number;
  totalBranches: number;
  revenueChange: number;
  salesChange: number;
  dailyRevenue: { date: string; revenue: number; sales: number }[];
  topBooks: { title: string; author: string; sold: number; revenue: number }[];
  branchPerformance: { name: string; revenue: number; sales: number }[];
  recentSales: Sale[];
  lowStockItems: InventoryItem[];
  categoryBreakdown: { category: string; count: number; value: number }[];
}

// --- API ---
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// --- UI State ---
export interface AppState {
  selectedBranch: string | null;
  setSelectedBranch: (branchId: string | null) => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
}
