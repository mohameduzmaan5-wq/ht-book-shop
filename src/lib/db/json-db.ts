import fs from 'fs';
import path from 'path';
import type { DatabaseInterface } from './db-interface';
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

// Import the initial mock data from the original db.ts as seed data
import {
  books as initialBooks,
  branches as initialBranches,
  users as initialUsers,
  inventory as initialInventory,
  stockTransfers as initialTransfers,
  expenses as initialExpenses,
  notifications as initialNotifications,
  auditLogs as initialAuditLogs,
} from './seed-data';

const DB_FILE = path.join(process.cwd(), 'bookshop-json-db.json');

interface Schema {
  books: Book[];
  branches: Branch[];
  users: User[];
  inventory: BranchInventory[];
  sales: Sale[];
  saleItems: SaleItem[];
  stockTransfers: StockTransfer[];
  expenses: Expense[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  settings: Record<string, any>;
  suppliers?: any[];
  purchaseOrders?: any[];
  purchaseOrderItems?: any[];
}

class JsonDatabase implements DatabaseInterface {
  private cache: Schema | null = null;

  private read(): Schema {
    if (this.cache) return this.cache;

    if (!fs.existsSync(DB_FILE)) {
      // Seed initial data
      const initialDb: Schema = {
        books: initialBooks,
        branches: initialBranches,
        users: initialUsers,
        inventory: initialInventory,
        sales: [],
        saleItems: [],
        stockTransfers: initialTransfers,
        expenses: initialExpenses,
        notifications: initialNotifications,
        auditLogs: initialAuditLogs,
        settings: {
          storeName: 'BookShop ERP',
          currency: 'LKR',
          timezone: 'Asia/Colombo',
          taxPercent: '5',
          receiptHeader: 'BookShop ERP - Your Reading Destination',
          receiptFooter: 'Thank you for shopping with us!',
          showLogo: true,
          receiptTemplate: 'classic',
          receiptFont: 'monospace',
          receiptFontSize: '12',
          receiptShowBarcode: true,
          receiptShowCashier: true,
        },
        suppliers: [],
        purchaseOrders: [],
        purchaseOrderItems: [],
      };
      this.write(initialDb);
      return initialDb;
    }

    try {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      const parsed = JSON.parse(data);
      if (!parsed.suppliers) parsed.suppliers = [];
      if (!parsed.purchaseOrders) parsed.purchaseOrders = [];
      if (!parsed.purchaseOrderItems) parsed.purchaseOrderItems = [];
      this.cache = parsed;
      return this.cache!;
    } catch (err) {
      console.error('Failed to parse JSON DB, recreating...', err);
      return {
        books: [],
        branches: [],
        users: [],
        inventory: [],
        sales: [],
        saleItems: [],
        stockTransfers: [],
        expenses: [],
        notifications: [],
        auditLogs: [],
        settings: {},
        suppliers: [],
        purchaseOrders: [],
        purchaseOrderItems: [],
      };
    }
  }

  private write(data: Schema) {
    this.cache = data;
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  }

  // Users
  async getUserByEmail(email: string): Promise<User | null> {
    const db = this.read();
    return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  async getUser(id: string): Promise<User | null> {
    const db = this.read();
    return db.users.find((u) => u.id === id) || null;
  }

  async getEmployees(branchId?: string): Promise<User[]> {
    const db = this.read();
    if (branchId) return db.users.filter((u) => u.branch_id === branchId);
    return db.users.filter((u) => u.role !== 'super_admin');
  }

  async createEmployee(employeeData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const db = this.read();
    const newEmployee: User = {
      ...employeeData,
      id: `user_${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.users.push(newEmployee);
    this.write(db);
    return newEmployee;
  }

  async deactivateEmployee(id: string): Promise<void> {
    const db = this.read();
    const emp = db.users.find((u) => u.id === id);
    if (emp) {
      emp.is_active = false;
      emp.updated_at = new Date().toISOString();
      this.write(db);
    }
  }

  // Branches
  async getBranch(id: string): Promise<Branch | null> {
    const db = this.read();
    return db.branches.find((b) => b.id === id) || null;
  }

  async getBranches(): Promise<Branch[]> {
    const db = this.read();
    return db.branches;
  }

  async createBranch(branchData: Omit<Branch, 'id' | 'created_at' | 'updated_at'>): Promise<Branch> {
    const db = this.read();
    const newBranch: Branch = {
      ...branchData,
      id: `branch_${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.branches.push(newBranch);
    this.write(db);
    return newBranch;
  }

  // Books
  async getBooks(search?: string, category?: string): Promise<Book[]> {
    const db = this.read();
    let result = [...db.books];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.isbn.replace(/-/g, '').includes(q) ||
          b.barcode.includes(q)
      );
    }
    if (category && category.toLowerCase() !== 'all') {
      result = result.filter((b) => b.category.toLowerCase() === category.toLowerCase());
    }
    return result;
  }

  async getBook(id: string): Promise<Book | null> {
    const db = this.read();
    return db.books.find((b) => b.id === id) || null;
  }

  async createBook(bookData: Omit<Book, 'id' | 'created_at' | 'updated_at'>): Promise<Book> {
    const db = this.read();
    const newBook: Book = {
      ...bookData,
      id: `book_${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.books.unshift(newBook);

    // Also initialize inventory for this book in all branches
    db.branches.forEach((branch) => {
      db.inventory.push({
        id: `inv_${Date.now()}_${branch.id}`,
        book_id: newBook.id,
        branch_id: branch.id,
        quantity: 10, // Default stock for new books
        reorder_level: 3,
        last_restocked: new Date().toISOString(),
      });
    });

    this.write(db);
    return newBook;
  }

  async updateBook(id: string, bookData: Partial<Omit<Book, 'id' | 'created_at' | 'updated_at'>>): Promise<Book> {
    const db = this.read();
    const idx = db.books.findIndex((b) => b.id === id);
    if (idx === -1) {
      throw new Error(`Book with ID ${id} not found.`);
    }

    const updatedBook = {
      ...db.books[idx],
      ...bookData,
      updated_at: new Date().toISOString(),
    };

    db.books[idx] = updatedBook;
    this.write(db);
    return updatedBook;
  }

  // Inventory
  async getInventory(branchId: string, search?: string, category?: string): Promise<(BranchInventory & { book?: Book })[]> {
    const db = this.read();
    let items = db.inventory.filter((i) => i.branch_id === branchId);
    if (search || category) {
      const filteredBooks = await this.getBooks(search, category);
      const bookIds = new Set(filteredBooks.map((b) => b.id));
      items = items.filter((i) => bookIds.has(i.book_id));
    }
    return items.map((i) => ({
      ...i,
      book: db.books.find((b) => b.id === i.book_id),
    }));
  }

  async getLowStock(branchId?: string): Promise<(BranchInventory & { book?: Book; branch?: Branch })[]> {
    const db = this.read();
    let items = db.inventory;
    if (branchId) items = items.filter((i) => i.branch_id === branchId);
    return items
      .filter((i) => i.quantity <= i.reorder_level)
      .map((i) => ({
        ...i,
        book: db.books.find((b) => b.id === i.book_id),
        branch: db.branches.find((br) => br.id === i.branch_id),
      }));
  }

  async updateInventoryQuantity(branchId: string, bookId: string, quantity: number): Promise<void> {
    const db = this.read();
    const inv = db.inventory.find((i) => i.branch_id === branchId && i.book_id === bookId);
    if (inv) {
      inv.quantity = quantity;
      inv.last_restocked = new Date().toISOString();
      this.write(db);
    }
  }

  async updateInventoryDetails(branchId: string, bookId: string, quantity: number, reorderLevel: number): Promise<void> {
    const db = this.read();
    const inv = db.inventory.find((i) => i.branch_id === branchId && i.book_id === bookId);
    if (inv) {
      inv.quantity = quantity;
      inv.reorder_level = reorderLevel;
      inv.last_restocked = new Date().toISOString();
      this.write(db);
    }
  }

  // Sales
  async getSales(branchId?: string, days?: number): Promise<(Sale & { items: (SaleItem & { book?: Book })[]; cashier?: User; branch?: Branch })[]> {
    const db = this.read();
    let result = [...db.sales];
    if (branchId) result = result.filter((s) => s.branch_id === branchId);
    if (days) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      result = result.filter((s) => new Date(s.created_at) >= cutoff);
    }
    return result.map((s) => ({
      ...s,
      items: db.saleItems
        .filter((si) => si.sale_id === s.id)
        .map((si) => ({
          ...si,
          book: db.books.find((b) => b.id === si.book_id),
        })),
      cashier: db.users.find((u) => u.id === s.cashier_id),
      branch: db.branches.find((b) => b.id === s.branch_id),
    }));
  }

  async getSaleItems(saleId: string): Promise<(SaleItem & { book?: Book })[]> {
    const db = this.read();
    return db.saleItems
      .filter((si) => si.sale_id === saleId)
      .map((si) => ({
        ...si,
        book: db.books.find((b) => b.id === si.book_id),
      }));
  }

  async createSale(saleData: {
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
  }): Promise<Sale> {
    const db = this.read();
    const saleId = `sale_${Date.now()}`;
    const amount_paid = saleData.amountPaid ?? (saleData.paymentMethod === 'credit' ? 0 : saleData.total);
    const amount_due = saleData.amountDue ?? (saleData.paymentMethod === 'credit' ? saleData.total : 0);
    const payment_status = amount_due === 0 ? 'paid' : amount_paid > 0 ? 'partial' : 'unpaid';

    const newSale: Sale = {
      id: saleId,
      branch_id: saleData.branchId,
      cashier_id: saleData.cashierId,
      customer_name: saleData.customerName,
      customer_email: saleData.customerEmail,
      customer_phone: saleData.customerPhone,
      subtotal: saleData.subtotal,
      discount_amount: saleData.discountAmount,
      discount_type: saleData.discountType,
      tax_amount: saleData.taxAmount,
      total: saleData.total,
      payment_method: saleData.paymentMethod,
      status: 'completed',
      notes: saleData.notes,
      amount_paid,
      amount_due,
      payment_status,
      created_at: new Date().toISOString(),
    };

    db.sales.unshift(newSale);

    saleData.items.forEach((item) => {
      const saleItemId = `si_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      db.saleItems.push({
        id: saleItemId,
        sale_id: saleId,
        book_id: item.bookId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        discount: item.discount,
        total: item.unitPrice * item.quantity - item.discount,
      });

      // Deduct stock
      const inv = db.inventory.find((i) => i.branch_id === saleData.branchId && i.book_id === item.bookId);
      if (inv) {
        inv.quantity = Math.max(0, inv.quantity - item.quantity);
        inv.last_restocked = new Date().toISOString();

        // Low stock warning trigger
        if (inv.quantity <= inv.reorder_level) {
          const bookObj = db.books.find((b) => b.id === item.bookId);
          const branchObj = db.branches.find((b) => b.id === saleData.branchId);
          db.notifications.unshift({
            id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            user_id: 'user_001', // Admin
            type: 'low_stock',
            title: 'Low Stock Alert',
            message: `${bookObj?.title || 'Book'} is low in stock at ${branchObj?.name || 'branch'} (${inv.quantity} left)`,
            is_read: false,
            metadata: JSON.stringify({ book_id: item.bookId, branch_id: saleData.branchId }),
            created_at: new Date().toISOString(),
          });
        }
      }
    });

    this.write(db);
    return newSale;
  }

  // Stock Transfers
  async getTransfers(branchId?: string): Promise<(StockTransfer & { book?: Book; from_branch?: Branch; to_branch?: Branch; requester?: User; approver?: User | null })[]> {
    const db = this.read();
    let result = [...db.stockTransfers];
    if (branchId) {
      result = result.filter((t) => t.from_branch_id === branchId || t.to_branch_id === branchId);
    }
    return result.map((t) => ({
      ...t,
      book: db.books.find((b) => b.id === t.book_id),
      from_branch: db.branches.find((b) => b.id === t.from_branch_id),
      to_branch: db.branches.find((b) => b.id === t.to_branch_id),
      requester: db.users.find((u) => u.id === t.requested_by),
      approver: t.approved_by ? db.users.find((u) => u.id === t.approved_by) : null,
    }));
  }

  async createTransfer(transferData: {
    bookId: string;
    fromBranchId: string;
    toBranchId: string;
    quantity: number;
    notes: string;
    requestedBy: string;
  }): Promise<StockTransfer> {
    const db = this.read();
    const newTx: StockTransfer = {
      id: `txfr_${Date.now()}`,
      book_id: transferData.bookId,
      from_branch_id: transferData.fromBranchId,
      to_branch_id: transferData.toBranchId,
      quantity: transferData.quantity,
      status: 'pending',
      requested_by: transferData.requestedBy,
      approved_by: null,
      notes: transferData.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.stockTransfers.unshift(newTx);
    this.write(db);
    return newTx;
  }

  async updateTransferStatus(id: string, status: 'approved' | 'completed' | 'rejected', userId: string): Promise<StockTransfer> {
    const db = this.read();
    const tx = db.stockTransfers.find((t) => t.id === id);
    if (!tx) throw new Error('Stock transfer request not found');

    tx.status = status;
    tx.approved_by = userId;
    tx.updated_at = new Date().toISOString();

    if (status === 'completed') {
      // Deduct from source branch
      const sourceInv = db.inventory.find(
        (i) => i.branch_id === tx.from_branch_id && i.book_id === tx.book_id
      );
      if (sourceInv) {
        sourceInv.quantity = Math.max(0, sourceInv.quantity - tx.quantity);
      }

      // Add to destination branch
      const destInv = db.inventory.find(
        (i) => i.branch_id === tx.to_branch_id && i.book_id === tx.book_id
      );
      if (destInv) {
        destInv.quantity += tx.quantity;
      }
    }

    this.write(db);
    return tx;
  }

  // Expenses
  async getExpenses(branchId?: string): Promise<Expense[]> {
    const db = this.read();
    if (branchId) return db.expenses.filter((e) => e.branch_id === branchId);
    return db.expenses;
  }

  // Notifications
  async getNotifications(userId: string): Promise<Notification[]> {
    const db = this.read();
    // Admin gets all notification types, cashiers get only target or low stock related
    return db.notifications.filter((n) => n.user_id === userId || userId === 'user_001');
  }

  async updateNotification(id: string, isRead: boolean): Promise<Notification> {
    const db = this.read();
    const notif = db.notifications.find((n) => n.id === id);
    if (!notif) throw new Error('Notification not found');
    notif.is_read = isRead;
    this.write(db);
    return notif;
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    const db = this.read();
    db.notifications.forEach((n) => {
      if (n.user_id === userId || userId === 'user_001') {
        n.is_read = true;
      }
    });
    this.write(db);
  }

  async createNotification(notif: Omit<Notification, 'id' | 'created_at'>): Promise<Notification> {
    const db = this.read();
    const newNotif: Notification = {
      ...notif,
      id: `notif_${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    db.notifications.unshift(newNotif);
    this.write(db);
    return newNotif;
  }

  // Audit Logs
  async getAuditLogs(): Promise<(AuditLog & { user?: User })[]> {
    const db = this.read();
    return db.auditLogs.map((l) => ({
      ...l,
      user: db.users.find((u) => u.id === l.user_id),
    }));
  }

  async createAuditLog(log: Omit<AuditLog, 'id' | 'created_at'>): Promise<AuditLog> {
    const db = this.read();
    const newLog: AuditLog = {
      ...log,
      id: `log_${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    db.auditLogs.unshift(newLog);
    this.write(db);
    return newLog;
  }

  // Settings
  async getSettings(): Promise<Record<string, any>> {
    const db = this.read();
    return db.settings || {};
  }

  async updateSettings(settings: Record<string, any>): Promise<void> {
    const db = this.read();
    db.settings = {
      ...db.settings,
      ...settings,
    };
    this.write(db);
  }

  // Dashboard Stats
  async getDashboardStats(branchId?: string) {
    const db = this.read();
    const allSales = await this.getSales(branchId);
    
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    // Filter sales
    const todaySales = allSales.filter(s => s.created_at.split('T')[0] === todayStr);
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const monthSales = allSales.filter(s => new Date(s.created_at) >= thirtyDaysAgo);

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(now.getDate() - 60);
    const prevMonthSales = allSales.filter(s => {
      const d = new Date(s.created_at);
      return d >= sixtyDaysAgo && d < thirtyDaysAgo;
    });

    const totalRevenue = monthSales.reduce((sum, s) => sum + s.total, 0);
    const prevRevenue = prevMonthSales.reduce((sum, s) => sum + s.total, 0);
    const revenueChange = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
    const salesChange = prevMonthSales.length > 0 ? ((monthSales.length - prevMonthSales.length) / prevMonthSales.length) * 100 : 0;

    // Daily revenue for last 30 days
    const dailyRevenue: { date: string; revenue: number; sales: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const daySales = monthSales.filter(s => s.created_at.split('T')[0] === dateStr);
      dailyRevenue.push({
        date: dateStr,
        revenue: Math.round(daySales.reduce((sum, s) => sum + s.total, 0) * 100) / 100,
        sales: daySales.length,
      });
    }

    // Top books
    const bookSalesMap = new Map<string, { sold: number; revenue: number }>();
    for (const s of monthSales) {
      for (const item of (s.items || [])) {
        const existing = bookSalesMap.get(item.book_id) || { sold: 0, revenue: 0 };
        bookSalesMap.set(item.book_id, {
          sold: existing.sold + item.quantity,
          revenue: existing.revenue + item.total,
        });
      }
    }
    const topBooks = Array.from(bookSalesMap.entries())
      .map(([bookId, stats]) => {
        const book = db.books.find(b => b.id === bookId);
        return { title: book?.title || '', author: book?.author || '', ...stats };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Branch performance
    const branchPerformance = db.branches.map(branch => {
      const branchSales = monthSales.filter(s => s.branch_id === branch.id);
      return {
        name: branch.name,
        revenue: Math.round(branchSales.reduce((sum, s) => sum + s.total, 0) * 100) / 100,
        sales: branchSales.length,
      };
    });

    // Category breakdown
    const catMap = new Map<string, { count: number; value: number }>();
    for (const inv of db.inventory) {
      if (branchId && inv.branch_id !== branchId) continue;
      const book = db.books.find(b => b.id === inv.book_id);
      if (!book) continue;
      const existing = catMap.get(book.category) || { count: 0, value: 0 };
      catMap.set(book.category, {
        count: existing.count + inv.quantity,
        value: existing.value + (inv.quantity * book.selling_price),
      });
    }
    const categoryBreakdown = Array.from(catMap.entries()).map(([category, stats]) => ({
      category,
      ...stats,
      value: Math.round(stats.value * 100) / 100,
    }));

    const lowStockItems = await this.getLowStock(branchId);

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalSales: monthSales.length,
      totalBooks: db.books.length,
      totalBranches: db.branches.length,
      revenueChange: Math.round(revenueChange * 10) / 10,
      salesChange: Math.round(salesChange * 10) / 10,
      dailyRevenue,
      topBooks,
      branchPerformance,
      recentSales: todaySales.slice(0, 10),
      lowStockItems: lowStockItems.slice(0, 10),
      categoryBreakdown,
    };
  }

  async updateUserProfile(userId: string, data: { name: string; email: string; password?: string }): Promise<User> {
    const db = this.read();
    const user = db.users.find((u: any) => u.id === userId);
    if (!user) throw new Error('User not found');

    user.name = data.name;
    user.email = data.email;
    if (data.password) {
      (user as any).password_hash = data.password;
    }
    user.updated_at = new Date().toISOString();
    
    this.write(db);
    return user;
  }

  async recordCustomerPayment(customerPhone: string, amount: number, paymentMethod: string): Promise<void> {
    const db = this.read();
    
    // Find all sales for this customer with outstanding due amount, sorted by created_at ASC
    const unpaidSales = db.sales
      .filter((s) => s.customer_phone === customerPhone && (s.amount_due ?? 0) > 0)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    let remaining = amount;
    for (const sale of unpaidSales) {
      if (remaining <= 0) break;
      const due = sale.amount_due ?? 0;
      const paymentForSale = Math.min(remaining, due);
      sale.amount_paid = (sale.amount_paid ?? 0) + paymentForSale;
      sale.amount_due = due - paymentForSale;
      sale.payment_status = sale.amount_due === 0 ? 'paid' : 'partial';
      remaining -= paymentForSale;
    }

    // Add Audit Log
    db.auditLogs.unshift({
      id: `audit_${Date.now()}`,
      user_id: 'system',
      action: 'RECORD_CUSTOMER_PAYMENT',
      entity_type: 'customer',
      entity_id: customerPhone,
      details: `Recorded customer payment of Rs. ${amount.toFixed(2)} via ${paymentMethod}`,
      ip_address: '127.0.0.1',
      created_at: new Date().toISOString()
    });

    this.write(db);
  }

  async getSuppliers(): Promise<any[]> {
    const db = this.read();
    return db.suppliers || [];
  }

  async createSupplier(supplierData: any): Promise<any> {
    const db = this.read();
    if (!db.suppliers) db.suppliers = [];
    
    const id = `sup_${Date.now()}`;
    const created_at = new Date().toISOString();
    const newSupplier = {
      id,
      ...supplierData,
      created_at
    };
    db.suppliers.push(newSupplier);
    this.write(db);
    return newSupplier;
  }

  async getPurchaseOrders(branchId?: string): Promise<any[]> {
    const db = this.read();
    let pos = db.purchaseOrders || [];
    if (branchId) {
      pos = pos.filter((po) => po.branch_id === branchId);
    }
    
    return pos.map((po) => {
      const supplier = db.suppliers?.find((s) => s.id === po.supplier_id);
      const branch = db.branches.find((b) => b.id === po.branch_id);
      const items = (db.purchaseOrderItems || [])
        .filter((poi) => poi.purchase_order_id === po.id)
        .map((poi) => {
          const book = db.books.find((b) => b.id === poi.book_id);
          return {
            ...poi,
            title: book?.title || 'Unknown Book',
            isbn: book?.isbn || ''
          };
        });

      return {
        ...po,
        supplier_name: supplier?.name || 'Unknown Supplier',
        branch_name: branch?.name || 'Unknown Branch',
        items
      };
    });
  }

  async createPurchaseOrder(poData: any): Promise<any> {
    const db = this.read();
    if (!db.purchaseOrders) db.purchaseOrders = [];
    if (!db.purchaseOrderItems) db.purchaseOrderItems = [];

    const id = `po_${Date.now()}`;
    const created_at = new Date().toISOString();

    const newPO = {
      id,
      supplier_id: poData.supplierId,
      branch_id: poData.branchId,
      invoice_no: poData.invoiceNo || '',
      date: poData.date,
      subtotal: poData.subtotal,
      discount: poData.discount || 0,
      total: poData.total,
      amount_paid: poData.amountPaid || 0,
      amount_due: poData.amountDue || 0,
      payment_method: poData.paymentMethod,
      status: poData.status,
      created_at
    };

    db.purchaseOrders.unshift(newPO);

    poData.items.forEach((item: any, idx: number) => {
      const itemId = `poi_${Date.now()}_${idx}`;
      db.purchaseOrderItems!.push({
        id: itemId,
        purchase_order_id: id,
        book_id: item.bookId,
        quantity: item.quantity,
        cost_price: item.costPrice,
        discount: item.discount || 0,
        total: item.total
      });

      // Update inventory
      let inv = db.inventory.find((i) => i.branch_id === poData.branchId && i.book_id === item.bookId);
      if (inv) {
        inv.quantity += item.quantity;
        inv.last_restocked = poData.date;
      } else {
        db.inventory.push({
          id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          book_id: item.bookId,
          branch_id: poData.branchId,
          quantity: item.quantity,
          reorder_level: 3,
          last_restocked: poData.date
        });
      }

      // Update book cost price in catalog
      const book = db.books.find((b) => b.id === item.bookId);
      if (book) {
        book.cost_price = item.costPrice;
        book.updated_at = created_at;
      }
    });

    this.write(db);
    return { id, ...poData, created_at };
  }

  async importSuppliers(suppliers: { name: string; phone?: string; email?: string; address?: string }[]): Promise<void> {
    const db = this.read();
    if (!db.suppliers) db.suppliers = [];
    for (const s of suppliers) {
      const id = `supplier_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      db.suppliers.push({
        id,
        name: s.name,
        phone: s.phone || '',
        email: s.email || '',
        address: s.address || '',
        created_at: new Date().toISOString()
      });
    }
    this.write(db);
  }

  async importInventory(branchId: string, items: {
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
  }[]): Promise<void> {
    const db = this.read();
    const now = new Date().toISOString();
    for (const item of items) {
      let book = db.books.find((b) => b.isbn === item.isbn);
      let bookId = '';
      if (book) {
        bookId = book.id;
        book.barcode = item.barcode;
        book.title = item.title;
        book.author = item.author;
        book.publisher = item.publisher || '';
        book.category = item.category || 'Fiction';
        book.description = item.description || '';
        book.cost_price = item.cost_price;
        book.selling_price = item.selling_price;
        book.updated_at = now;
      } else {
        bookId = `book_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        db.books.push({
          id: bookId,
          isbn: item.isbn,
          barcode: item.barcode,
          title: item.title,
          author: item.author,
          publisher: item.publisher || '',
          category: item.category || 'Fiction',
          description: item.description || '',
          cost_price: item.cost_price,
          selling_price: item.selling_price,
          image_url: '',
          created_at: now,
          updated_at: now
        });
      }

      const inv = db.inventory.find((i) => i.branch_id === branchId && i.book_id === bookId);
      if (inv) {
        inv.quantity = item.quantity;
        inv.reorder_level = item.reorder_level;
        inv.last_restocked = now;
      } else {
        const invId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        db.inventory.push({
          id: invId,
          branch_id: branchId,
          book_id: bookId,
          quantity: item.quantity,
          reorder_level: item.reorder_level,
          last_restocked: now
        });
      }
    }
    this.write(db);
  }

  async importCustomers(customers: {
    name: string;
    email?: string;
    phone?: string;
    totalSpent: number;
    totalDue: number;
  }[]): Promise<void> {
    const db = this.read();
    const now = new Date().toISOString();
    for (const c of customers) {
      const id = `sale_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const total = c.totalSpent || 0;
      const due = c.totalDue || 0;
      const paid = Math.max(0, total - due);
      
      let paymentStatus: 'paid' | 'unpaid' | 'partial' = 'paid';
      if (due > 0) {
        paymentStatus = paid === 0 ? 'unpaid' : 'partial';
      }
      const paymentMethod = due > 0 ? 'credit' : 'cash';

      db.sales.push({
        id,
        branch_id: 'branch_001',
        cashier_id: 'system',
        customer_name: c.name,
        customer_email: c.email || '',
        customer_phone: c.phone || '',
        subtotal: total,
        discount_amount: 0,
        discount_type: 'percentage',
        tax_amount: 0,
        total: total,
        payment_method: paymentMethod,
        status: 'completed',
        notes: 'Imported profile',
        amount_paid: paid,
        amount_due: due,
        payment_status: paymentStatus,
        created_at: now
      });
    }
    this.write(db);
  }
}


export const jsonDb = new JsonDatabase();
export default jsonDb;
