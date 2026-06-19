import type {
  User,
  Branch,
  Book,
  BranchInventory,
  Sale,
  SaleItem,
  StockTransfer,
  Notification,
  AuditLog,
  Expense,
} from '@/types';

export interface DatabaseInterface {
  // Users / Auth
  getUserByEmail(email: string): Promise<User | null>;
  getUser(id: string): Promise<User | null>;
  getEmployees(branchId?: string): Promise<User[]>;
  createEmployee(employeeData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User>;
  deactivateEmployee(id: string): Promise<void>;

  // Branches
  getBranch(id: string): Promise<Branch | null>;
  getBranches(): Promise<Branch[]>;
  createBranch(branchData: Omit<Branch, 'id' | 'created_at' | 'updated_at'>): Promise<Branch>;

  // Books / Catalog
  getBooks(search?: string, category?: string): Promise<Book[]>;
  getBook(id: string): Promise<Book | null>;
  createBook(bookData: Omit<Book, 'id' | 'created_at' | 'updated_at'>): Promise<Book>;
  updateBook(id: string, bookData: Partial<Omit<Book, 'id' | 'created_at' | 'updated_at'>>): Promise<Book>;

  // Inventory
  getInventory(branchId: string, search?: string, category?: string): Promise<(BranchInventory & { book?: Book })[]>;
  getLowStock(branchId?: string): Promise<(BranchInventory & { book?: Book; branch?: Branch })[]>;
  updateInventoryQuantity(branchId: string, bookId: string, quantity: number): Promise<void>;
  updateInventoryDetails(branchId: string, bookId: string, quantity: number, reorderLevel: number): Promise<void>;

  // Sales
  getSales(branchId?: string, days?: number): Promise<(Sale & { items: (SaleItem & { book?: Book })[]; cashier?: User; branch?: Branch })[]>;
  getSaleItems(saleId: string): Promise<(SaleItem & { book?: Book })[]>;
  createSale(saleData: {
    branchId: string;
    cashierId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    subtotal: number;
    discountAmount: number;
    discountType: 'percentage' | 'flat';
    taxAmount: number;
    total: number;
    paymentMethod: 'cash' | 'card' | 'mobile' | 'credit';
    notes: string;
    amountPaid?: number;
    amountDue?: number;
    items: { bookId: string; quantity: number; unitPrice: number; discount: number }[];
  }): Promise<Sale>;

  // Stock Transfers
  getTransfers(branchId?: string): Promise<(StockTransfer & { book?: Book; from_branch?: Branch; to_branch?: Branch; requester?: User; approver?: User | null })[]>;
  createTransfer(transferData: {
    bookId: string;
    fromBranchId: string;
    toBranchId: string;
    quantity: number;
    notes: string;
    requestedBy: string;
  }): Promise<StockTransfer>;
  updateTransferStatus(id: string, status: 'approved' | 'completed' | 'rejected', userId: string): Promise<StockTransfer>;

  // Expenses
  getExpenses(branchId?: string): Promise<Expense[]>;

  // Notifications
  getNotifications(userId: string): Promise<Notification[]>;
  updateNotification(id: string, isRead: boolean): Promise<Notification>;
  markAllNotificationsRead(userId: string): Promise<void>;
  createNotification(notif: Omit<Notification, 'id' | 'created_at'>): Promise<Notification>;

  // Audit Logs
  getAuditLogs(): Promise<(AuditLog & { user?: User })[]>;
  createAuditLog(log: Omit<AuditLog, 'id' | 'created_at'>): Promise<AuditLog>;

  // System Settings
  getSettings(): Promise<Record<string, any>>;
  updateSettings(settings: Record<string, any>): Promise<void>;

  // User profile settings
  updateUserProfile(userId: string, data: { name: string; email: string; password?: string }): Promise<User>;

  // Dashboard Stats
  getDashboardStats(branchId?: string): Promise<any>;

  // Customer Payments
  recordCustomerPayment(customerPhone: string, amount: number, paymentMethod: string): Promise<void>;

  // Suppliers
  getSuppliers(): Promise<any[]>;
  createSupplier(supplierData: any): Promise<any>;

  // Purchase Orders
  getPurchaseOrders(branchId?: string): Promise<any[]>;
  createPurchaseOrder(poData: any): Promise<any>;

  // Bulk CSV Imports
  importSuppliers(suppliers: { name: string; phone?: string; email?: string; address?: string }[]): Promise<void>;
  importInventory(branchId: string, items: {
    isbn: string;
    barcode: string;
    title: string;
    author: string;
    publisher: string;
    category: string;
    description: string;
    cost_price: number;
    selling_price: number;
    quantity: number;
    reorder_level: number;
  }[]): Promise<void>;
  importCustomers(customers: {
    name: string;
    email?: string;
    phone?: string;
    totalSpent: number;
    totalDue: number;
  }[]): Promise<void>;
}

