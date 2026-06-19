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

const DB_PATH = path.join(process.cwd(), 'bookshop.db');

class SqliteDatabase implements DatabaseInterface {
  private db: any;

  constructor() {
    const Database = require('better-sqlite3');
    this.db = new Database(DB_PATH);
    this.init();
  }

  private init() {
    // Enable WAL mode for performance
    this.db.pragma('journal_mode = WAL');

    // Alter tables for existing databases
    try {
      this.db.exec("ALTER TABLE sales ADD COLUMN amount_paid REAL DEFAULT 0;");
    } catch (e) {}
    try {
      this.db.exec("ALTER TABLE sales ADD COLUMN amount_due REAL DEFAULT 0;");
    } catch (e) {}
    try {
      this.db.exec("ALTER TABLE sales ADD COLUMN payment_status TEXT DEFAULT 'paid';");
    } catch (e) {}

    // Create Tables
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        branch_id TEXT,
        is_active INTEGER DEFAULT 1,
        avatar TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS branches (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT NOT NULL,
        manager_id TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS books (
        id TEXT PRIMARY KEY,
        isbn TEXT UNIQUE NOT NULL,
        barcode TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        publisher TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        cost_price REAL NOT NULL,
        selling_price REAL NOT NULL,
        image_url TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS branch_inventory (
        id TEXT PRIMARY KEY,
        book_id TEXT NOT NULL,
        branch_id TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0,
        reorder_level INTEGER NOT NULL DEFAULT 3,
        last_restocked TEXT NOT NULL,
        UNIQUE(book_id, branch_id)
      );

      CREATE TABLE IF NOT EXISTS sales (
        id TEXT PRIMARY KEY,
        branch_id TEXT NOT NULL,
        cashier_id TEXT NOT NULL,
        customer_name TEXT,
        customer_email TEXT,
        customer_phone TEXT,
        subtotal REAL NOT NULL,
        discount_amount REAL NOT NULL DEFAULT 0,
        discount_type TEXT NOT NULL,
        tax_amount REAL NOT NULL DEFAULT 0,
        total REAL NOT NULL,
        payment_method TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'completed',
        notes TEXT,
        amount_paid REAL NOT NULL DEFAULT 0,
        amount_due REAL NOT NULL DEFAULT 0,
        payment_status TEXT NOT NULL DEFAULT 'paid',
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sale_items (
        id TEXT PRIMARY KEY,
        sale_id TEXT NOT NULL,
        book_id TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        discount REAL NOT NULL DEFAULT 0,
        total REAL NOT NULL
      );

      CREATE TABLE IF NOT EXISTS stock_transfers (
        id TEXT PRIMARY KEY,
        book_id TEXT NOT NULL,
        from_branch_id TEXT NOT NULL,
        to_branch_id TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        requested_by TEXT NOT NULL,
        approved_by TEXT,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        branch_id TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        amount REAL NOT NULL,
        date TEXT NOT NULL,
        created_by TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        metadata TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT,
        details TEXT,
        ip_address TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );

      CREATE TABLE IF NOT EXISTS suppliers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        address TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS purchase_orders (
        id TEXT PRIMARY KEY,
        supplier_id TEXT NOT NULL,
        branch_id TEXT NOT NULL,
        invoice_no TEXT,
        date TEXT NOT NULL,
        subtotal REAL NOT NULL,
        discount REAL NOT NULL DEFAULT 0,
        total REAL NOT NULL,
        amount_paid REAL NOT NULL DEFAULT 0,
        amount_due REAL NOT NULL DEFAULT 0,
        payment_method TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS purchase_order_items (
        id TEXT PRIMARY KEY,
        purchase_order_id TEXT NOT NULL,
        book_id TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        cost_price REAL NOT NULL,
        discount REAL NOT NULL DEFAULT 0,
        total REAL NOT NULL
      );
    `);

    // Check if database needs seeding
    const userCount = this.db.prepare('SELECT count(*) as count FROM users').get().count;
    if (userCount === 0) {
      console.log('Seeding SQLite database with initial demo data...');
      this.seed();
    } else {
      // Migrate: set default password for any demo users that have empty password_hash
      this.db.prepare("UPDATE users SET password_hash = 'password' WHERE password_hash = '' OR password_hash IS NULL").run();
    }
  }

  private seed() {
    const insertUser = this.db.prepare(`
      INSERT INTO users (id, email, password_hash, name, role, branch_id, is_active, avatar, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertBranch = this.db.prepare(`
      INSERT INTO branches (id, name, address, phone, email, manager_id, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertBook = this.db.prepare(`
      INSERT INTO books (id, isbn, barcode, title, author, publisher, category, description, cost_price, selling_price, image_url, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertInventory = this.db.prepare(`
      INSERT INTO branch_inventory (id, book_id, branch_id, quantity, reorder_level, last_restocked)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const insertTransfer = this.db.prepare(`
      INSERT INTO stock_transfers (id, book_id, from_branch_id, to_branch_id, quantity, status, requested_by, approved_by, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertExpense = this.db.prepare(`
      INSERT INTO expenses (id, branch_id, category, description, amount, date, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertNotif = this.db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, is_read, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertAudit = this.db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, ip_address, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertSetting = this.db.prepare(`
      INSERT INTO system_settings (key, value)
      VALUES (?, ?)
    `);

    // Run in a single transaction
    const runSeedTransaction = this.db.transaction(() => {
      initialUsers.forEach(u => {
        // Default demo password is "password"
        insertUser.run(u.id, u.email, 'password', u.name, u.role, u.branch_id, u.is_active ? 1 : 0, u.avatar, u.created_at, u.updated_at);
      });
      initialBranches.forEach(b => {
        insertBranch.run(b.id, b.name, b.address, b.phone, b.email, b.manager_id, b.is_active ? 1 : 0, b.created_at, b.updated_at);
      });
      initialBooks.forEach(b => {
        insertBook.run(b.id, b.isbn, b.barcode, b.title, b.author, b.publisher, b.category, b.description, b.cost_price, b.selling_price, b.image_url, b.created_at, b.updated_at);
      });
      initialInventory.forEach(i => {
        insertInventory.run(i.id, i.book_id, i.branch_id, i.quantity, i.reorder_level, i.last_restocked);
      });
      initialTransfers.forEach(t => {
        insertTransfer.run(t.id, t.book_id, t.from_branch_id, t.to_branch_id, t.quantity, t.status, t.requested_by, t.approved_by, t.notes, t.created_at, t.updated_at);
      });
      initialExpenses.forEach(e => {
        insertExpense.run(e.id, e.branch_id, e.category, e.description, e.amount, e.date, e.created_by, e.created_at);
      });
      initialNotifications.forEach(n => {
        insertNotif.run(n.id, n.user_id, n.type, n.title, n.message, n.is_read ? 1 : 0, n.metadata, n.created_at);
      });
      initialAuditLogs.forEach(a => {
        insertAudit.run(a.id, a.user_id, a.action, a.entity_type, a.entity_id, a.details, a.ip_address, a.created_at);
      });

      // Settings
      const settings = {
        storeName: 'BookShop ERP',
        currency: 'LKR',
        timezone: 'Asia/Colombo',
        taxPercent: '5',
        receiptHeader: 'BookShop ERP - Your Reading Destination',
        receiptFooter: 'Thank you for shopping with us!',
        showLogo: 'true',
        receiptTemplate: 'classic',
        receiptFont: 'monospace',
        receiptFontSize: '12',
        receiptShowBarcode: 'true',
        receiptShowCashier: 'true',
      };
      Object.entries(settings).forEach(([key, val]) => {
        insertSetting.run(key, val);
      });
    });

    runSeedTransaction();
  }

  // Users
  async getUserByEmail(email: string): Promise<User | null> {
    const row = this.db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email);
    if (!row) return null;
    return { ...row, is_active: row.is_active === 1 };
  }

  async getUser(id: string): Promise<User | null> {
    const row = this.db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!row) return null;
    return { ...row, is_active: row.is_active === 1 };
  }

  async getEmployees(branchId?: string): Promise<User[]> {
    let stmt;
    if (branchId) {
      stmt = this.db.prepare("SELECT * FROM users WHERE branch_id = ? AND role != 'super_admin'");
      return stmt.all(branchId).map((row: any) => ({ ...row, is_active: row.is_active === 1 }));
    }
    stmt = this.db.prepare("SELECT * FROM users WHERE role != 'super_admin'");
    return stmt.all().map((row: any) => ({ ...row, is_active: row.is_active === 1 }));
  }

  async createEmployee(employeeData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const newEmployee: User = {
      ...employeeData,
      id: `user_${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.db.prepare(`
      INSERT INTO users (id, email, password_hash, name, role, branch_id, is_active, avatar, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      newEmployee.id,
      newEmployee.email,
      'password',
      newEmployee.name,
      newEmployee.role,
      newEmployee.branch_id,
      newEmployee.is_active ? 1 : 0,
      newEmployee.avatar || '',
      newEmployee.created_at,
      newEmployee.updated_at
    );
    return newEmployee;
  }

  async deactivateEmployee(id: string): Promise<void> {
    this.db.prepare('UPDATE users SET is_active = 0, updated_at = ? WHERE id = ?').run(
      new Date().toISOString(),
      id
    );
  }

  // Branches
  async getBranch(id: string): Promise<Branch | null> {
    const row = this.db.prepare('SELECT * FROM branches WHERE id = ?').get(id);
    if (!row) return null;
    return { ...row, is_active: row.is_active === 1 };
  }

  async getBranches(): Promise<Branch[]> {
    const rows = this.db.prepare('SELECT * FROM branches').all();
    return rows.map((row: any) => ({ ...row, is_active: row.is_active === 1 }));
  }

  async createBranch(branchData: Omit<Branch, 'id' | 'created_at' | 'updated_at'>): Promise<Branch> {
    const newBranch: Branch = {
      ...branchData,
      id: `branch_${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.db.prepare(`
      INSERT INTO branches (id, name, address, phone, email, manager_id, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      newBranch.id,
      newBranch.name,
      newBranch.address,
      newBranch.phone,
      newBranch.email,
      newBranch.manager_id,
      newBranch.is_active ? 1 : 0,
      newBranch.created_at,
      newBranch.updated_at
    );
    return newBranch;
  }

  // Books
  async getBooks(search?: string, category?: string): Promise<Book[]> {
    let sql = 'SELECT * FROM books WHERE 1=1';
    const params: any[] = [];

    if (search) {
      sql += ' AND (LOWER(title) LIKE ? OR LOWER(author) LIKE ? OR replace(isbn, \'-\', \'\') LIKE ? OR barcode LIKE ?)';
      const term = `%${search.toLowerCase()}%`;
      params.push(term, term, term, term);
    }

    if (category && category.toLowerCase() !== 'all') {
      sql += ' AND LOWER(category) = LOWER(?)';
      params.push(category);
    }

    sql += ' ORDER BY created_at DESC';
    return this.db.prepare(sql).all(...params);
  }

  async getBook(id: string): Promise<Book | null> {
    const row = this.db.prepare('SELECT * FROM books WHERE id = ?').get(id);
    return row || null;
  }

  async createBook(bookData: Omit<Book, 'id' | 'created_at' | 'updated_at'>): Promise<Book> {
    const newBook: Book = {
      ...bookData,
      id: `book_${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const runTransaction = this.db.transaction(() => {
      this.db.prepare(`
        INSERT INTO books (id, isbn, barcode, title, author, publisher, category, description, cost_price, selling_price, image_url, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        newBook.id,
        newBook.isbn,
        newBook.barcode,
        newBook.title,
        newBook.author,
        newBook.publisher,
        newBook.category,
        newBook.description || '',
        newBook.cost_price,
        newBook.selling_price,
        newBook.image_url || '',
        newBook.created_at,
        newBook.updated_at
      );

      // Seed inventory for all branches
      const branches = this.db.prepare('SELECT id FROM branches').all();
      const insertInv = this.db.prepare(`
        INSERT INTO branch_inventory (id, book_id, branch_id, quantity, reorder_level, last_restocked)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      branches.forEach((br: any) => {
        insertInv.run(
          `inv_${Date.now()}_${br.id}`,
          newBook.id,
          br.id,
          10,
          3,
          new Date().toISOString()
        );
      });
    });

    runTransaction();
    return newBook;
  }

  async updateBook(id: string, bookData: Partial<Omit<Book, 'id' | 'created_at' | 'updated_at'>>): Promise<Book> {
    const existing = await this.getBook(id);
    if (!existing) {
      throw new Error(`Book with ID ${id} not found.`);
    }

    const updatedBook = {
      ...existing,
      ...bookData,
      updated_at: new Date().toISOString(),
    };

    this.db.prepare(`
      UPDATE books
      SET isbn = ?, barcode = ?, title = ?, author = ?, publisher = ?, category = ?, description = ?, cost_price = ?, selling_price = ?, image_url = ?, updated_at = ?
      WHERE id = ?
    `).run(
      updatedBook.isbn,
      updatedBook.barcode,
      updatedBook.title,
      updatedBook.author,
      updatedBook.publisher,
      updatedBook.category,
      updatedBook.description || '',
      updatedBook.cost_price,
      updatedBook.selling_price,
      updatedBook.image_url || '',
      updatedBook.updated_at,
      id
    );

    return updatedBook;
  }

  // Inventory
  async getInventory(branchId: string, search?: string, category?: string): Promise<(BranchInventory & { book?: Book })[]> {
    let sql = `
      SELECT bi.*, b.title, b.author, b.isbn, b.category, b.cost_price, b.selling_price, b.publisher, b.description, b.image_url
      FROM branch_inventory bi
      JOIN books b ON bi.book_id = b.id
      WHERE bi.branch_id = ?
    `;
    const params: any[] = [branchId];

    if (search) {
      sql += ' AND (LOWER(b.title) LIKE ? OR LOWER(b.author) LIKE ? OR replace(b.isbn, \'-\', \'\') LIKE ?)';
      const term = `%${search.toLowerCase()}%`;
      params.push(term, term, term);
    }

    if (category && category.toLowerCase() !== 'all') {
      sql += ' AND LOWER(b.category) = LOWER(?)';
      params.push(category);
    }

    const rows = this.db.prepare(sql).all(...params);
    return rows.map((row: any) => ({
      id: row.id,
      book_id: row.book_id,
      branch_id: row.branch_id,
      quantity: row.quantity,
      reorder_level: row.reorder_level,
      last_restocked: row.last_restocked,
      book: {
        id: row.book_id,
        isbn: row.isbn,
        barcode: row.barcode || '',
        title: row.title,
        author: row.author,
        publisher: row.publisher,
        category: row.category,
        description: row.description,
        cost_price: row.cost_price,
        selling_price: row.selling_price,
        image_url: row.image_url,
        created_at: '',
        updated_at: '',
      },
    }));
  }

  async getLowStock(branchId?: string): Promise<(BranchInventory & { book?: Book; branch?: Branch })[]> {
    let sql = `
      SELECT bi.*, b.title, b.author, b.isbn, b.category, b.cost_price, b.selling_price, b.publisher, b.description, b.image_url, br.name as branch_name
      FROM branch_inventory bi
      JOIN books b ON bi.book_id = b.id
      JOIN branches br ON bi.branch_id = br.id
      WHERE bi.quantity <= bi.reorder_level
    `;
    const params: any[] = [];

    if (branchId) {
      sql += ' AND bi.branch_id = ?';
      params.push(branchId);
    }

    const rows = this.db.prepare(sql).all(...params);
    return rows.map((row: any) => ({
      id: row.id,
      book_id: row.book_id,
      branch_id: row.branch_id,
      quantity: row.quantity,
      reorder_level: row.reorder_level,
      last_restocked: row.last_restocked,
      book: {
        id: row.book_id,
        isbn: row.isbn,
        barcode: '',
        title: row.title,
        author: row.author,
        publisher: row.publisher,
        category: row.category,
        description: row.description,
        cost_price: row.cost_price,
        selling_price: row.selling_price,
        image_url: row.image_url,
        created_at: '',
        updated_at: '',
      },
      branch: {
        id: row.branch_id,
        name: row.branch_name,
        address: '',
        phone: '',
        email: '',
        manager_id: '',
        is_active: true,
        created_at: '',
        updated_at: '',
      },
    }));
  }

  async updateInventoryQuantity(branchId: string, bookId: string, quantity: number): Promise<void> {
    this.db.prepare(`
      UPDATE branch_inventory
      SET quantity = ?, last_restocked = ?
      WHERE branch_id = ? AND book_id = ?
    `).run(quantity, new Date().toISOString(), branchId, bookId);
  }

  async updateInventoryDetails(branchId: string, bookId: string, quantity: number, reorderLevel: number): Promise<void> {
    this.db.prepare(`
      UPDATE branch_inventory
      SET quantity = ?, reorder_level = ?, last_restocked = ?
      WHERE branch_id = ? AND book_id = ?
    `).run(quantity, reorderLevel, new Date().toISOString(), branchId, bookId);
  }

  // Sales
  async getSales(branchId?: string, days?: number): Promise<(Sale & { items: (SaleItem & { book?: Book })[]; cashier?: User; branch?: Branch })[]> {
    let sql = 'SELECT * FROM sales WHERE 1=1';
    const params: any[] = [];

    if (branchId) {
      sql += ' AND branch_id = ?';
      params.push(branchId);
    }

    if (days) {
      sql += ' AND datetime(created_at) >= datetime(\'now\', ?)';
      params.push(`-${days} days`);
    }

    sql += ' ORDER BY created_at DESC';
    const salesRows = this.db.prepare(sql).all(...params);

    return salesRows.map((sale: any) => {
      const items = this.db.prepare(`
        SELECT si.*, b.title, b.author, b.isbn, b.category, b.selling_price
        FROM sale_items si
        JOIN books b ON si.book_id = b.id
        WHERE si.sale_id = ?
      `).all(sale.id).map((item: any) => ({
        id: item.id,
        sale_id: item.sale_id,
        book_id: item.book_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount: item.discount,
        total: item.total,
        book: {
          id: item.book_id,
          isbn: item.isbn,
          barcode: '',
          title: item.title,
          author: item.author,
          publisher: '',
          category: item.category,
          description: '',
          cost_price: 0,
          selling_price: item.selling_price,
          image_url: '',
          created_at: '',
          updated_at: '',
        },
      }));

      const cashierRow = this.db.prepare('SELECT id, name, email, role, branch_id FROM users WHERE id = ?').get(sale.cashier_id);
      const branchRow = this.db.prepare('SELECT id, name FROM branches WHERE id = ?').get(sale.branch_id);

      return {
        ...sale,
        items,
        cashier: cashierRow ? { ...cashierRow, is_active: true, avatar: '', created_at: '', updated_at: '' } : undefined,
        branch: branchRow ? { ...branchRow, address: '', phone: '', email: '', manager_id: '', is_active: true, created_at: '', updated_at: '' } : undefined,
      };
    });
  }

  async getSaleItems(saleId: string): Promise<(SaleItem & { book?: Book })[]> {
    const rows = this.db.prepare(`
      SELECT si.*, b.title, b.author, b.isbn, b.category, b.selling_price
      FROM sale_items si
      JOIN books b ON si.book_id = b.id
      WHERE si.sale_id = ?
    `).all(saleId);

    return rows.map((item: any) => ({
      id: item.id,
      sale_id: item.sale_id,
      book_id: item.book_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount: item.discount,
      total: item.total,
      book: {
        id: item.book_id,
        isbn: item.isbn,
        barcode: '',
        title: item.title,
        author: item.author,
        publisher: '',
        category: item.category,
        description: '',
        cost_price: 0,
        selling_price: item.selling_price,
        image_url: '',
        created_at: '',
        updated_at: '',
      },
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
    const saleId = `sale_${Date.now()}`;
    const timestamp = new Date().toISOString();
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
      created_at: timestamp,
    };

    const runTransaction = this.db.transaction(() => {
      // Insert sale
      this.db.prepare(`
        INSERT INTO sales (id, branch_id, cashier_id, customer_name, customer_email, customer_phone, subtotal, discount_amount, discount_type, tax_amount, total, payment_method, status, notes, amount_paid, amount_due, payment_status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        newSale.id,
        newSale.branch_id,
        newSale.cashier_id,
        newSale.customer_name,
        newSale.customer_email,
        newSale.customer_phone,
        newSale.subtotal,
        newSale.discount_amount,
        newSale.discount_type,
        newSale.tax_amount,
        newSale.total,
        newSale.payment_method,
        newSale.status,
        newSale.notes,
        newSale.amount_paid,
        newSale.amount_due,
        newSale.payment_status,
        newSale.created_at
      );

      // Insert sale items & deduct inventory
      const insertItem = this.db.prepare(`
        INSERT INTO sale_items (id, sale_id, book_id, quantity, unit_price, discount, total)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      const updateInv = this.db.prepare(`
        UPDATE branch_inventory
        SET quantity = MAX(0, quantity - ?), last_restocked = ?
        WHERE branch_id = ? AND book_id = ?
      `);
      const getInv = this.db.prepare(`
        SELECT quantity, reorder_level FROM branch_inventory
        WHERE branch_id = ? AND book_id = ?
      `);

      saleData.items.forEach((item) => {
        const itemId = `si_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const itemTotal = item.unitPrice * item.quantity - item.discount;
        insertItem.run(
          itemId,
          saleId,
          item.bookId,
          item.quantity,
          item.unitPrice,
          item.discount,
          itemTotal
        );

        updateInv.run(item.quantity, timestamp, saleData.branchId, item.bookId);

        // Low stock notification check
        const currentInv = getInv.get(saleData.branchId, item.bookId);
        if (currentInv && currentInv.quantity <= currentInv.reorder_level) {
          const bookObj = this.db.prepare('SELECT title FROM books WHERE id = ?').get(item.bookId);
          const branchObj = this.db.prepare('SELECT name FROM branches WHERE id = ?').get(saleData.branchId);
          
          this.db.prepare(`
            INSERT INTO notifications (id, user_id, type, title, message, is_read, metadata, created_at)
            VALUES (?, ?, ?, ?, ?, 0, ?, ?)
          `).run(
            `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            'user_001',
            'low_stock',
            'Low Stock Alert',
            `${bookObj?.title || 'Book'} is low in stock at ${branchObj?.name || 'branch'} (${currentInv.quantity} left)`,
            JSON.stringify({ book_id: item.bookId, branch_id: saleData.branchId }),
            timestamp
          );
        }
      });

      // Audit Log
      this.db.prepare(`
        INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, ip_address, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        `log_${Date.now()}`,
        saleData.cashierId,
        'POS Sale Created',
        'Sale',
        saleId,
        `Created sale of $${saleData.total.toFixed(2)} with ${saleData.items.length} items.`,
        '127.0.0.1',
        timestamp
      );
    });

    runTransaction();
    return newSale;
  }

  // Stock Transfers
  async getTransfers(branchId?: string): Promise<(StockTransfer & { book?: Book; from_branch?: Branch; to_branch?: Branch; requester?: User; approver?: User | null })[]> {
    let sql = 'SELECT * FROM stock_transfers';
    const params: any[] = [];
    if (branchId) {
      sql += ' WHERE from_branch_id = ? OR to_branch_id = ?';
      params.push(branchId, branchId);
    }
    sql += ' ORDER BY created_at DESC';
    const rows = this.db.prepare(sql).all(...params);

    return rows.map((t: any) => {
      const book = this.db.prepare('SELECT * FROM books WHERE id = ?').get(t.book_id);
      const fromBranch = this.db.prepare('SELECT * FROM branches WHERE id = ?').get(t.from_branch_id);
      const toBranch = this.db.prepare('SELECT * FROM branches WHERE id = ?').get(t.to_branch_id);
      const requester = this.db.prepare('SELECT id, name, role, email FROM users WHERE id = ?').get(t.requested_by);
      const approver = t.approved_by ? this.db.prepare('SELECT id, name, role, email FROM users WHERE id = ?').get(t.approved_by) : null;

      return {
        ...t,
        book,
        from_branch: fromBranch,
        to_branch: toBranch,
        requester,
        approver,
      };
    });
  }

  async createTransfer(transferData: {
    bookId: string;
    fromBranchId: string;
    toBranchId: string;
    quantity: number;
    notes: string;
    requestedBy: string;
  }): Promise<StockTransfer> {
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

    this.db.prepare(`
      INSERT INTO stock_transfers (id, book_id, from_branch_id, to_branch_id, quantity, status, requested_by, approved_by, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      newTx.id,
      newTx.book_id,
      newTx.from_branch_id,
      newTx.to_branch_id,
      newTx.quantity,
      newTx.status,
      newTx.requested_by,
      null,
      newTx.notes,
      newTx.created_at,
      newTx.updated_at
    );

    return newTx;
  }

  async updateTransferStatus(id: string, status: 'approved' | 'completed' | 'rejected', userId: string): Promise<StockTransfer> {
    const tx = this.db.prepare('SELECT * FROM stock_transfers WHERE id = ?').get(id);
    if (!tx) throw new Error('Stock transfer request not found');

    const timestamp = new Date().toISOString();

    const runTransaction = this.db.transaction(() => {
      this.db.prepare(`
        UPDATE stock_transfers
        SET status = ?, approved_by = ?, updated_at = ?
        WHERE id = ?
      `).run(status, userId, timestamp, id);

      if (status === 'completed') {
        // Deduct from source branch
        this.db.prepare(`
          UPDATE branch_inventory
          SET quantity = MAX(0, quantity - ?), last_restocked = ?
          WHERE branch_id = ? AND book_id = ?
        `).run(tx.quantity, timestamp, tx.from_branch_id, tx.book_id);

        // Add to destination branch
        this.db.prepare(`
          UPDATE branch_inventory
          SET quantity = quantity + ?, last_restocked = ?
          WHERE branch_id = ? AND book_id = ?
        `).run(tx.quantity, timestamp, tx.to_branch_id, tx.book_id);
      }
    });

    runTransaction();

    return {
      ...tx,
      status,
      approved_by: userId,
      updated_at: timestamp,
    };
  }

  // Expenses
  async getExpenses(branchId?: string): Promise<Expense[]> {
    if (branchId) {
      return this.db.prepare('SELECT * FROM expenses WHERE branch_id = ? ORDER BY date DESC').all(branchId);
    }
    return this.db.prepare('SELECT * FROM expenses ORDER BY date DESC').all();
  }

  // Notifications
  async getNotifications(userId: string): Promise<Notification[]> {
    let rows;
    if (userId === 'user_001') {
      rows = this.db.prepare('SELECT * FROM notifications ORDER BY created_at DESC').all();
    } else {
      rows = this.db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC').all(userId);
    }
    return rows.map((r: any) => ({ ...r, is_read: r.is_read === 1 }));
  }

  async updateNotification(id: string, isRead: boolean): Promise<Notification> {
    this.db.prepare('UPDATE notifications SET is_read = ? WHERE id = ?').run(isRead ? 1 : 0, id);
    const row = this.db.prepare('SELECT * FROM notifications WHERE id = ?').get(id);
    return { ...row, is_read: row.is_read === 1 };
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    if (userId === 'user_001') {
      this.db.prepare('UPDATE notifications SET is_read = 1').run();
    } else {
      this.db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(userId);
    }
  }

  async createNotification(notif: Omit<Notification, 'id' | 'created_at'>): Promise<Notification> {
    const newNotif: Notification = {
      ...notif,
      id: `notif_${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    this.db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, is_read, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      newNotif.id,
      newNotif.user_id,
      newNotif.type,
      newNotif.title,
      newNotif.message,
      newNotif.is_read ? 1 : 0,
      newNotif.metadata || '',
      newNotif.created_at
    );
    return newNotif;
  }

  // Audit Logs
  async getAuditLogs(): Promise<(AuditLog & { user?: User })[]> {
    const rows = this.db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC').all();
    return rows.map((log: any) => {
      const user = this.db.prepare('SELECT id, name, role, email FROM users WHERE id = ?').get(log.user_id);
      return {
        ...log,
        user: user ? { ...user, is_active: true, avatar: '', created_at: '', updated_at: '' } : undefined,
      };
    });
  }

  async createAuditLog(log: Omit<AuditLog, 'id' | 'created_at'>): Promise<AuditLog> {
    const newLog: AuditLog = {
      ...log,
      id: `log_${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    this.db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, ip_address, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      newLog.id,
      newLog.user_id,
      newLog.action,
      newLog.entity_type,
      newLog.entity_id || '',
      newLog.details || '',
      newLog.ip_address || '',
      newLog.created_at
    );
    return newLog;
  }

  // Settings
  async getSettings(): Promise<Record<string, any>> {
    const rows = this.db.prepare('SELECT * FROM system_settings').all();
    const settings: Record<string, any> = {};
    rows.forEach((row: any) => {
      let val: any = row.value;
      if (val === 'true') val = true;
      if (val === 'false') val = false;
      settings[row.key] = val;
    });
    return settings;
  }

  async updateSettings(settings: Record<string, any>): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO system_settings (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);
    
    const runTransaction = this.db.transaction(() => {
      Object.entries(settings).forEach(([key, val]) => {
        stmt.run(key, String(val));
      });
    });
    runTransaction();
  }

  // Dashboard Stats
  async getDashboardStats(branchId?: string) {
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
        const book = this.db.prepare('SELECT title, author FROM books WHERE id = ?').get(bookId);
        return { title: book?.title || '', author: book?.author || '', ...stats };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Branch performance
    const branches = this.db.prepare('SELECT id, name FROM branches').all();
    const branchPerformance = branches.map((branch: any) => {
      const branchSales = monthSales.filter(s => s.branch_id === branch.id);
      return {
        name: branch.name,
        revenue: Math.round(branchSales.reduce((sum, s) => sum + s.total, 0) * 100) / 100,
        sales: branchSales.length,
      };
    });

    // Category breakdown
    const invRows = this.db.prepare(`
      SELECT bi.quantity, bi.branch_id, b.category, b.selling_price
      FROM branch_inventory bi
      JOIN books b ON bi.book_id = b.id
    `).all();

    const catMap = new Map<string, { count: number; value: number }>();
    invRows.forEach((inv: any) => {
      if (branchId && inv.branch_id !== branchId) return;
      const existing = catMap.get(inv.category) || { count: 0, value: 0 };
      catMap.set(inv.category, {
        count: existing.count + inv.quantity,
        value: existing.value + (inv.quantity * inv.selling_price),
      });
    });
    
    const categoryBreakdown = Array.from(catMap.entries()).map(([category, stats]) => ({
      category,
      ...stats,
      value: Math.round(stats.value * 100) / 100,
    }));

    const lowStockItems = await this.getLowStock(branchId);
    const bookCount = this.db.prepare('SELECT count(*) as count FROM books').get().count;

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalSales: monthSales.length,
      totalBooks: bookCount,
      totalBranches: branches.length,
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
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');

    const updatedName = data.name;
    const updatedEmail = data.email;
    const updated_at = new Date().toISOString();

    if (data.password) {
      this.db.prepare(`
        UPDATE users 
        SET name = ?, email = ?, password_hash = ?, updated_at = ? 
        WHERE id = ?
      `).run(updatedName, updatedEmail, data.password, updated_at, userId);
    } else {
      this.db.prepare(`
        UPDATE users 
        SET name = ?, email = ?, updated_at = ? 
        WHERE id = ?
      `).run(updatedName, updatedEmail, updated_at, userId);
    }

    return {
      ...user,
      name: updatedName,
      email: updatedEmail,
      updated_at
    };
  }

  async recordCustomerPayment(customerPhone: string, amount: number, paymentMethod: string): Promise<void> {
    const unpaidSales = this.db.prepare(`
      SELECT * FROM sales 
      WHERE customer_phone = ? AND amount_due > 0 
      ORDER BY created_at ASC
    `).all(customerPhone);

    let remaining = amount;
    const stmt = this.db.prepare(`
      UPDATE sales 
      SET amount_paid = amount_paid + ?, 
          amount_due = amount_due - ?, 
          payment_status = ? 
      WHERE id = ?
    `);

    const recordTransaction = this.db.transaction(() => {
      for (const sale of unpaidSales) {
        if (remaining <= 0) break;
        const due = sale.amount_due;
        const paymentForSale = Math.min(remaining, due);
        const newDue = due - paymentForSale;
        const status = newDue === 0 ? 'paid' : 'partial';
        
        stmt.run(paymentForSale, paymentForSale, status, sale.id);
        remaining -= paymentForSale;
      }

      // Log an audit log entry
      this.db.prepare(`
        INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, ip_address, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        `audit_${Date.now()}`,
        'system',
        'RECORD_CUSTOMER_PAYMENT',
        'customer',
        customerPhone,
        `Recorded customer payment of Rs. ${amount.toFixed(2)} via ${paymentMethod}`,
        '127.0.0.1',
        new Date().toISOString()
      );
    });

    recordTransaction();
  }

  async getSuppliers(): Promise<any[]> {
    return this.db.prepare('SELECT * FROM suppliers ORDER BY name ASC').all();
  }

  async createSupplier(supplierData: any): Promise<any> {
    const id = `sup_${Date.now()}`;
    const created_at = new Date().toISOString();
    this.db.prepare(`
      INSERT INTO suppliers (id, name, phone, email, address, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, supplierData.name, supplierData.phone || '', supplierData.email || '', supplierData.address || '', created_at);
    return { id, ...supplierData, created_at };
  }

  async getPurchaseOrders(branchId?: string): Promise<any[]> {
    let query = `
      SELECT po.*, s.name as supplier_name, b.name as branch_name 
      FROM purchase_orders po
      JOIN suppliers s ON po.supplier_id = s.id
      JOIN branches b ON po.branch_id = b.id
    `;
    let args: any[] = [];
    if (branchId) {
      query += ' WHERE po.branch_id = ?';
      args.push(branchId);
    }
    query += ' ORDER BY po.date DESC';
    const pos = this.db.prepare(query).all(...args);
    
    // Fetch items for each purchase order
    const itemStmt = this.db.prepare(`
      SELECT poi.*, b.title, b.isbn 
      FROM purchase_order_items poi
      JOIN books b ON poi.book_id = b.id
      WHERE poi.purchase_order_id = ?
    `);

    return pos.map((po: any) => {
      const items = itemStmt.all(po.id);
      return { ...po, items };
    });
  }

  async createPurchaseOrder(poData: any): Promise<any> {
    const id = `po_${Date.now()}`;
    const created_at = new Date().toISOString();
    
    const poInsert = this.db.prepare(`
      INSERT INTO purchase_orders (id, supplier_id, branch_id, invoice_no, date, subtotal, discount, total, amount_paid, amount_due, payment_method, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const itemInsert = this.db.prepare(`
      INSERT INTO purchase_order_items (id, purchase_order_id, book_id, quantity, cost_price, discount, total)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const updateStock = this.db.prepare(`
      INSERT INTO branch_inventory (id, book_id, branch_id, quantity, reorder_level, last_restocked)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(book_id, branch_id) DO UPDATE SET 
        quantity = quantity + excluded.quantity,
        last_restocked = excluded.last_restocked
    `);

    const updateBookCost = this.db.prepare(`
      UPDATE books 
      SET cost_price = ?, updated_at = ? 
      WHERE id = ?
    `);

    const runTransaction = this.db.transaction(() => {
      poInsert.run(
        id,
        poData.supplierId,
        poData.branchId,
        poData.invoiceNo || '',
        poData.date,
        poData.subtotal,
        poData.discount || 0,
        poData.total,
        poData.amountPaid || 0,
        poData.amountDue || 0,
        poData.paymentMethod,
        poData.status,
        created_at
      );

      poData.items.forEach((item: any, idx: number) => {
        const itemId = `poi_${Date.now()}_${idx}`;
        itemInsert.run(
          itemId,
          id,
          item.bookId,
          item.quantity,
          item.costPrice,
          item.discount || 0,
          item.total
        );

        // Update branch inventory stock
        const invId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        updateStock.run(
          invId,
          item.bookId,
          poData.branchId,
          item.quantity,
          3, // default reorder level
          poData.date
        );

        // Proactively update book cost price in catalog
        updateBookCost.run(item.costPrice, created_at, item.bookId);
      });
    });

    runTransaction();
    return { id, ...poData, created_at };
  }

  async importSuppliers(suppliers: { name: string; phone?: string; email?: string; address?: string }[]): Promise<void> {
    const insertSupplier = this.db.prepare(`
      INSERT INTO suppliers (id, name, phone, email, address, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const runTransaction = this.db.transaction(() => {
      for (const s of suppliers) {
        const id = `supplier_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        insertSupplier.run(
          id,
          s.name,
          s.phone || '',
          s.email || '',
          s.address || '',
          new Date().toISOString()
        );
      }
    });

    runTransaction();
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
    const findBook = this.db.prepare(`SELECT * FROM books WHERE isbn = ?`);
    const insertBook = this.db.prepare(`
      INSERT INTO books (id, isbn, barcode, title, author, publisher, category, description, cost_price, selling_price, image_url, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const updateBookObj = this.db.prepare(`
      UPDATE books
      SET barcode = ?, title = ?, author = ?, publisher = ?, category = ?, description = ?, cost_price = ?, selling_price = ?, updated_at = ?
      WHERE id = ?
    `);
    const findInventory = this.db.prepare(`SELECT * FROM branch_inventory WHERE branch_id = ? AND book_id = ?`);
    const insertInventory = this.db.prepare(`
      INSERT INTO branch_inventory (id, branch_id, book_id, quantity, reorder_level, last_restocked)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const updateInventoryObj = this.db.prepare(`
      UPDATE branch_inventory
      SET quantity = ?, reorder_level = ?, last_restocked = ?
      WHERE branch_id = ? AND book_id = ?
    `);

    const runTransaction = this.db.transaction(() => {
      const now = new Date().toISOString();
      for (const item of items) {
        let book = findBook.get(item.isbn) as any;
        let bookId = '';
        if (book) {
          bookId = book.id;
          updateBookObj.run(
            item.barcode,
            item.title,
            item.author,
            item.publisher || '',
            item.category || 'Fiction',
            item.description || '',
            item.cost_price,
            item.selling_price,
            now,
            bookId
          );
        } else {
          bookId = `book_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          insertBook.run(
            bookId,
            item.isbn,
            item.barcode,
            item.title,
            item.author,
            item.publisher || '',
            item.category || 'Fiction',
            item.description || '',
            item.cost_price,
            item.selling_price,
            '', // image_url
            now,
            now
          );
        }

        const inv = findInventory.get(branchId, bookId) as any;
        if (inv) {
          updateInventoryObj.run(
            item.quantity,
            item.reorder_level,
            now,
            branchId,
            bookId
          );
        } else {
          const invId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          insertInventory.run(
            invId,
            branchId,
            bookId,
            item.quantity,
            item.reorder_level,
            now
          );
        }
      }
    });

    runTransaction();
  }

  async importCustomers(customers: {
    name: string;
    email?: string;
    phone?: string;
    totalSpent: number;
    totalDue: number;
  }[]): Promise<void> {
    const insertSale = this.db.prepare(`
      INSERT INTO sales (
        id, branch_id, cashier_id, customer_name, customer_email, customer_phone,
        subtotal, discount_amount, discount_type, tax_amount, total,
        payment_method, status, notes, amount_paid, amount_due, payment_status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const runTransaction = this.db.transaction(() => {
      const now = new Date().toISOString();
      for (const c of customers) {
        const id = `sale_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const total = c.totalSpent || 0;
        const due = c.totalDue || 0;
        const paid = Math.max(0, total - due);
        
        let paymentStatus = 'paid';
        if (due > 0) {
          paymentStatus = paid === 0 ? 'unpaid' : 'partial';
        }
        const paymentMethod = due > 0 ? 'credit' : 'cash';

        insertSale.run(
          id,
          'branch_001', // default branch
          'system',     // cashier
          c.name,
          c.email || '',
          c.phone || '',
          total,        // subtotal
          0,            // discount_amount
          'percentage', // discount_type
          0,            // tax_amount
          total,        // total
          paymentMethod,
          'completed',  // status
          'Imported profile', // notes
          paid,
          due,
          paymentStatus,
          now
        );
      }
    });

    runTransaction();
  }
}

export const sqliteDb = new SqliteDatabase();
export default sqliteDb;
