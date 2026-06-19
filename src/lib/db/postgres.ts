import { Pool } from 'pg';
import type { DatabaseInterface } from './db-interface';
import type {
  User, Branch, Book, BranchInventory, Sale, SaleItem,
  StockTransfer, Notification, AuditLog, Expense,
} from '@/types';
import {
  books as initialBooks, branches as initialBranches, users as initialUsers,
  inventory as initialInventory, stockTransfers as initialTransfers,
  expenses as initialExpenses, notifications as initialNotifications,
  auditLogs as initialAuditLogs,
} from './seed-data';

let pool: Pool;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  }
  return pool;
}

async function query(sql: string, params?: any[]) {
  const client = getPool();
  const result = await client.query(sql, params);
  return result.rows;
}

async function queryOne(sql: string, params?: any[]) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

class PostgresDatabase implements DatabaseInterface {

  async init() {
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT,
        name TEXT NOT NULL, role TEXT NOT NULL, branch_id TEXT,
        is_active BOOLEAN DEFAULT true, avatar TEXT,
        created_at TEXT NOT NULL, updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS branches (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, address TEXT NOT NULL,
        phone TEXT NOT NULL, email TEXT NOT NULL, manager_id TEXT,
        is_active BOOLEAN DEFAULT true, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS books (
        id TEXT PRIMARY KEY, isbn TEXT UNIQUE NOT NULL, barcode TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL, author TEXT NOT NULL, publisher TEXT NOT NULL,
        category TEXT NOT NULL, description TEXT, cost_price REAL NOT NULL,
        selling_price REAL NOT NULL, image_url TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS branch_inventory (
        id TEXT PRIMARY KEY, book_id TEXT NOT NULL, branch_id TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0, reorder_level INTEGER NOT NULL DEFAULT 3,
        last_restocked TEXT NOT NULL, UNIQUE(book_id, branch_id)
      );
      CREATE TABLE IF NOT EXISTS sales (
        id TEXT PRIMARY KEY, branch_id TEXT NOT NULL, cashier_id TEXT NOT NULL,
        customer_name TEXT, customer_email TEXT, customer_phone TEXT,
        subtotal REAL NOT NULL, discount_amount REAL NOT NULL DEFAULT 0,
        discount_type TEXT NOT NULL, tax_amount REAL NOT NULL DEFAULT 0,
        total REAL NOT NULL, payment_method TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'completed', notes TEXT,
        amount_paid REAL NOT NULL DEFAULT 0, amount_due REAL NOT NULL DEFAULT 0,
        payment_status TEXT NOT NULL DEFAULT 'paid', created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS sale_items (
        id TEXT PRIMARY KEY, sale_id TEXT NOT NULL, book_id TEXT NOT NULL,
        quantity INTEGER NOT NULL, unit_price REAL NOT NULL,
        discount REAL NOT NULL DEFAULT 0, total REAL NOT NULL
      );
      CREATE TABLE IF NOT EXISTS stock_transfers (
        id TEXT PRIMARY KEY, book_id TEXT NOT NULL, from_branch_id TEXT NOT NULL,
        to_branch_id TEXT NOT NULL, quantity INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending', requested_by TEXT NOT NULL,
        approved_by TEXT, notes TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY, branch_id TEXT NOT NULL, category TEXT NOT NULL,
        description TEXT, amount REAL NOT NULL, date TEXT NOT NULL,
        created_by TEXT NOT NULL, created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY, user_id TEXT NOT NULL, type TEXT NOT NULL,
        title TEXT NOT NULL, message TEXT NOT NULL, is_read BOOLEAN DEFAULT false,
        metadata TEXT, created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY, user_id TEXT NOT NULL, action TEXT NOT NULL,
        entity_type TEXT NOT NULL, entity_id TEXT, details TEXT,
        ip_address TEXT, created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS system_settings (key TEXT PRIMARY KEY, value TEXT);
      CREATE TABLE IF NOT EXISTS suppliers (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT, email TEXT,
        address TEXT, created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS purchase_orders (
        id TEXT PRIMARY KEY, supplier_id TEXT NOT NULL, branch_id TEXT NOT NULL,
        invoice_no TEXT, date TEXT NOT NULL, subtotal REAL NOT NULL,
        discount REAL NOT NULL DEFAULT 0, total REAL NOT NULL,
        amount_paid REAL NOT NULL DEFAULT 0, amount_due REAL NOT NULL DEFAULT 0,
        payment_method TEXT NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS purchase_order_items (
        id TEXT PRIMARY KEY, purchase_order_id TEXT NOT NULL, book_id TEXT NOT NULL,
        quantity INTEGER NOT NULL, cost_price REAL NOT NULL,
        discount REAL NOT NULL DEFAULT 0, total REAL NOT NULL
      );
    `);

    const countRows = await query('SELECT count(*) as count FROM users');
    const count = parseInt(countRows[0]?.count ?? '0');
    if (count === 0) {
      await this.seed();
    } else {
      await query("UPDATE users SET password_hash = 'password' WHERE password_hash = '' OR password_hash IS NULL");
    }
  }

  private async seed() {
    for (const u of initialUsers) {
      await query(
        'INSERT INTO users (id,email,password_hash,name,role,branch_id,is_active,avatar,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT DO NOTHING',
        [u.id, u.email, 'password', u.name, u.role, u.branch_id, u.is_active, u.avatar, u.created_at, u.updated_at]
      );
    }
    for (const b of initialBranches) {
      await query(
        'INSERT INTO branches (id,name,address,phone,email,manager_id,is_active,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT DO NOTHING',
        [b.id, b.name, b.address, b.phone, b.email, b.manager_id, b.is_active, b.created_at, b.updated_at]
      );
    }
    for (const b of initialBooks) {
      await query(
        'INSERT INTO books (id,isbn,barcode,title,author,publisher,category,description,cost_price,selling_price,image_url,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) ON CONFLICT DO NOTHING',
        [b.id, b.isbn, b.barcode, b.title, b.author, b.publisher, b.category, b.description, b.cost_price, b.selling_price, b.image_url, b.created_at, b.updated_at]
      );
    }
    for (const i of initialInventory) {
      await query(
        'INSERT INTO branch_inventory (id,book_id,branch_id,quantity,reorder_level,last_restocked) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING',
        [i.id, i.book_id, i.branch_id, i.quantity, i.reorder_level, i.last_restocked]
      );
    }
    for (const t of initialTransfers) {
      await query(
        'INSERT INTO stock_transfers (id,book_id,from_branch_id,to_branch_id,quantity,status,requested_by,approved_by,notes,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT DO NOTHING',
        [t.id, t.book_id, t.from_branch_id, t.to_branch_id, t.quantity, t.status, t.requested_by, t.approved_by, t.notes, t.created_at, t.updated_at]
      );
    }
    for (const e of initialExpenses) {
      await query(
        'INSERT INTO expenses (id,branch_id,category,description,amount,date,created_by,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING',
        [e.id, e.branch_id, e.category, e.description, e.amount, e.date, e.created_by, e.created_at]
      );
    }
    for (const n of initialNotifications) {
      await query(
        'INSERT INTO notifications (id,user_id,type,title,message,is_read,metadata,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING',
        [n.id, n.user_id, n.type, n.title, n.message, n.is_read, n.metadata, n.created_at]
      );
    }
    for (const a of initialAuditLogs) {
      await query(
        'INSERT INTO audit_logs (id,user_id,action,entity_type,entity_id,details,ip_address,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING',
        [a.id, a.user_id, a.action, a.entity_type, a.entity_id, a.details, a.ip_address, a.created_at]
      );
    }
    const settings: Record<string, string> = {
      storeName: 'BookShop ERP', currency: 'LKR', timezone: 'Asia/Colombo',
      taxPercent: '5', receiptHeader: 'BookShop ERP - Your Reading Destination',
      receiptFooter: 'Thank you for shopping with us!', showLogo: 'true',
      receiptTemplate: 'classic', receiptFont: 'monospace', receiptFontSize: '12',
      receiptShowBarcode: 'true', receiptShowCashier: 'true',
    };
    for (const [key, val] of Object.entries(settings)) {
      await query('INSERT INTO system_settings (key,value) VALUES ($1,$2) ON CONFLICT DO NOTHING', [key, val]);
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return queryOne('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
  }

  async getUser(id: string): Promise<User | null> {
    return queryOne('SELECT * FROM users WHERE id = $1', [id]);
  }

  async getEmployees(branchId?: string): Promise<User[]> {
    if (branchId) return query("SELECT * FROM users WHERE branch_id = $1 AND role != 'super_admin'", [branchId]);
    return query("SELECT * FROM users WHERE role != 'super_admin'");
  }

  async createEmployee(employeeData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const newEmployee: User = { ...employeeData, id: `user_${Date.now()}`, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    await query(
      'INSERT INTO users (id,email,password_hash,name,role,branch_id,is_active,avatar,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
      [newEmployee.id, newEmployee.email, 'password', newEmployee.name, newEmployee.role, newEmployee.branch_id, newEmployee.is_active, newEmployee.avatar || '', newEmployee.created_at, newEmployee.updated_at]
    );
    return newEmployee;
  }

  async deactivateEmployee(id: string): Promise<void> {
    await query('UPDATE users SET is_active = false, updated_at = $1 WHERE id = $2', [new Date().toISOString(), id]);
  }

  async getBranch(id: string): Promise<Branch | null> {
    return queryOne('SELECT * FROM branches WHERE id = $1', [id]);
  }

  async getBranches(): Promise<Branch[]> {
    return query('SELECT * FROM branches');
  }

  async createBranch(branchData: Omit<Branch, 'id' | 'created_at' | 'updated_at'>): Promise<Branch> {
    const newBranch: Branch = { ...branchData, id: `branch_${Date.now()}`, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    await query(
      'INSERT INTO branches (id,name,address,phone,email,manager_id,is_active,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
      [newBranch.id, newBranch.name, newBranch.address, newBranch.phone, newBranch.email, newBranch.manager_id, newBranch.is_active, newBranch.created_at, newBranch.updated_at]
    );
    return newBranch;
  }

  async getBooks(search?: string, category?: string): Promise<Book[]> {
    let sql = 'SELECT * FROM books WHERE 1=1';
    const params: any[] = [];
    let i = 1;
    if (search) {
      sql += ` AND (LOWER(title) LIKE $${i} OR LOWER(author) LIKE $${i+1} OR REPLACE(isbn,'-','') LIKE $${i+2} OR barcode LIKE $${i+3})`;
      const term = `%${search.toLowerCase()}%`;
      params.push(term, term, term, term); i += 4;
    }
    if (category && category.toLowerCase() !== 'all') {
      sql += ` AND LOWER(category) = LOWER($${i})`;
      params.push(category);
    }
    sql += ' ORDER BY created_at DESC';
    return query(sql, params);
  }

  async getBook(id: string): Promise<Book | null> {
    return queryOne('SELECT * FROM books WHERE id = $1', [id]);
  }

  async createBook(bookData: Omit<Book, 'id' | 'created_at' | 'updated_at'>): Promise<Book> {
    const newBook: Book = { ...bookData, id: `book_${Date.now()}`, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    await query(
      'INSERT INTO books (id,isbn,barcode,title,author,publisher,category,description,cost_price,selling_price,image_url,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)',
      [newBook.id, newBook.isbn, newBook.barcode, newBook.title, newBook.author, newBook.publisher, newBook.category, newBook.description||'', newBook.cost_price, newBook.selling_price, newBook.image_url||'', newBook.created_at, newBook.updated_at]
    );
    const branches = await this.getBranches();
    for (const br of branches) {
      await query(
        'INSERT INTO branch_inventory (id,book_id,branch_id,quantity,reorder_level,last_restocked) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING',
        [`inv_${Date.now()}_${br.id}`, newBook.id, br.id, 10, 3, new Date().toISOString()]
      );
    }
    return newBook;
  }

  async updateBook(id: string, bookData: Partial<Omit<Book, 'id' | 'created_at' | 'updated_at'>>): Promise<Book> {
    const existing = await this.getBook(id);
    if (!existing) throw new Error(`Book ${id} not found`);
    const updated = { ...existing, ...bookData, updated_at: new Date().toISOString() };
    await query(
      'UPDATE books SET isbn=$1,barcode=$2,title=$3,author=$4,publisher=$5,category=$6,description=$7,cost_price=$8,selling_price=$9,image_url=$10,updated_at=$11 WHERE id=$12',
      [updated.isbn, updated.barcode, updated.title, updated.author, updated.publisher, updated.category, updated.description||'', updated.cost_price, updated.selling_price, updated.image_url||'', updated.updated_at, id]
    );
    return updated;
  }

  async getInventory(branchId: string, search?: string, category?: string): Promise<(BranchInventory & { book?: Book })[]> {
    let sql = `SELECT bi.*,b.title,b.author,b.isbn,b.barcode,b.category,b.cost_price,b.selling_price,b.publisher,b.description,b.image_url FROM branch_inventory bi JOIN books b ON bi.book_id=b.id WHERE bi.branch_id=$1`;
    const params: any[] = [branchId];
    let i = 2;
    if (search) {
      sql += ` AND (LOWER(b.title) LIKE $${i} OR LOWER(b.author) LIKE $${i+1} OR REPLACE(b.isbn,'-','') LIKE $${i+2})`;
      const term = `%${search.toLowerCase()}%`;
      params.push(term, term, term); i += 3;
    }
    if (category && category.toLowerCase() !== 'all') {
      sql += ` AND LOWER(b.category) = LOWER($${i})`;
      params.push(category);
    }
    const rows = await query(sql, params);
    return rows.map((row: any) => ({
      id: row.id, book_id: row.book_id, branch_id: row.branch_id,
      quantity: row.quantity, reorder_level: row.reorder_level, last_restocked: row.last_restocked,
      book: { id: row.book_id, isbn: row.isbn, barcode: row.barcode||'', title: row.title, author: row.author, publisher: row.publisher, category: row.category, description: row.description, cost_price: row.cost_price, selling_price: row.selling_price, image_url: row.image_url, created_at: '', updated_at: '' },
    }));
  }

  async getLowStock(branchId?: string): Promise<(BranchInventory & { book?: Book; branch?: Branch })[]> {
    let sql = `SELECT bi.*,b.title,b.author,b.isbn,b.category,b.cost_price,b.selling_price,b.publisher,b.description,b.image_url,br.name as branch_name FROM branch_inventory bi JOIN books b ON bi.book_id=b.id JOIN branches br ON bi.branch_id=br.id WHERE bi.quantity<=bi.reorder_level`;
    const params: any[] = [];
    if (branchId) { sql += ` AND bi.branch_id=$1`; params.push(branchId); }
    const rows = await query(sql, params);
    return rows.map((row: any) => ({
      id: row.id, book_id: row.book_id, branch_id: row.branch_id,
      quantity: row.quantity, reorder_level: row.reorder_level, last_restocked: row.last_restocked,
      book: { id: row.book_id, isbn: row.isbn, barcode: '', title: row.title, author: row.author, publisher: row.publisher, category: row.category, description: row.description, cost_price: row.cost_price, selling_price: row.selling_price, image_url: row.image_url, created_at: '', updated_at: '' },
      branch: { id: row.branch_id, name: row.branch_name, address: '', phone: '', email: '', manager_id: '', is_active: true, created_at: '', updated_at: '' },
    }));
  }

  async updateInventoryQuantity(branchId: string, bookId: string, quantity: number): Promise<void> {
    await query('UPDATE branch_inventory SET quantity=$1,last_restocked=$2 WHERE branch_id=$3 AND book_id=$4', [quantity, new Date().toISOString(), branchId, bookId]);
  }

  async updateInventoryDetails(branchId: string, bookId: string, quantity: number, reorderLevel: number): Promise<void> {
    await query('UPDATE branch_inventory SET quantity=$1,reorder_level=$2,last_restocked=$3 WHERE branch_id=$4 AND book_id=$5', [quantity, reorderLevel, new Date().toISOString(), branchId, bookId]);
  }

  async getSales(branchId?: string, days?: number): Promise<(Sale & { items: (SaleItem & { book?: Book })[]; cashier?: User; branch?: Branch })[]> {
    let sql = 'SELECT * FROM sales WHERE 1=1';
    const params: any[] = [];
    let i = 1;
    if (branchId) { sql += ` AND branch_id=$${i++}`; params.push(branchId); }
    if (days) { sql += ` AND created_at >= NOW() - INTERVAL '${days} days'`; }
    sql += ' ORDER BY created_at DESC';
    const salesRows = await query(sql, params);
    return Promise.all(salesRows.map(async (sale: any) => {
      const items = await query(`SELECT si.*,b.title,b.author,b.isbn,b.category,b.selling_price FROM sale_items si JOIN books b ON si.book_id=b.id WHERE si.sale_id=$1`, [sale.id]);
      const cashierRow = await queryOne('SELECT id,name,email,role,branch_id FROM users WHERE id=$1', [sale.cashier_id]);
      const branchRow = await queryOne('SELECT id,name FROM branches WHERE id=$1', [sale.branch_id]);
      return {
        ...sale,
        items: items.map((item: any) => ({ ...item, book: { id: item.book_id, isbn: item.isbn, barcode: '', title: item.title, author: item.author, publisher: '', category: item.category, description: '', cost_price: 0, selling_price: item.selling_price, image_url: '', created_at: '', updated_at: '' } })),
        cashier: cashierRow ? { ...cashierRow, is_active: true, avatar: '', created_at: '', updated_at: '' } : undefined,
        branch: branchRow ? { ...branchRow, address: '', phone: '', email: '', manager_id: '', is_active: true, created_at: '', updated_at: '' } : undefined,
      };
    }));
  }

  async getSaleItems(saleId: string): Promise<(SaleItem & { book?: Book })[]> {
    const rows = await query(`SELECT si.*,b.title,b.author,b.isbn,b.category,b.selling_price FROM sale_items si JOIN books b ON si.book_id=b.id WHERE si.sale_id=$1`, [saleId]);
    return rows.map((item: any) => ({ ...item, book: { id: item.book_id, isbn: item.isbn, barcode: '', title: item.title, author: item.author, publisher: '', category: item.category, description: '', cost_price: 0, selling_price: item.selling_price, image_url: '', created_at: '', updated_at: '' } }));
  }

  async createSale(saleData: any): Promise<Sale> {
    const saleId = `sale_${Date.now()}`;
    const timestamp = new Date().toISOString();
    const amount_paid = saleData.amountPaid ?? (saleData.paymentMethod === 'credit' ? 0 : saleData.total);
    const amount_due = saleData.amountDue ?? (saleData.paymentMethod === 'credit' ? saleData.total : 0);
    const payment_status = amount_due === 0 ? 'paid' : amount_paid > 0 ? 'partial' : 'unpaid';
    const newSale: Sale = { id: saleId, branch_id: saleData.branchId, cashier_id: saleData.cashierId, customer_name: saleData.customerName, customer_email: saleData.customerEmail, customer_phone: saleData.customerPhone, subtotal: saleData.subtotal, discount_amount: saleData.discountAmount, discount_type: saleData.discountType, tax_amount: saleData.taxAmount, total: saleData.total, payment_method: saleData.paymentMethod, status: 'completed', notes: saleData.notes, amount_paid, amount_due, payment_status, created_at: timestamp };
    await query('INSERT INTO sales (id,branch_id,cashier_id,customer_name,customer_email,customer_phone,subtotal,discount_amount,discount_type,tax_amount,total,payment_method,status,notes,amount_paid,amount_due,payment_status,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)', [saleId, saleData.branchId, saleData.cashierId, saleData.customerName, saleData.customerEmail, saleData.customerPhone, saleData.subtotal, saleData.discountAmount, saleData.discountType, saleData.taxAmount, saleData.total, saleData.paymentMethod, 'completed', saleData.notes, amount_paid, amount_due, payment_status, timestamp]);
    for (const item of saleData.items) {
      const itemId = `si_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const itemTotal = item.unitPrice * item.quantity - item.discount;
      await query('INSERT INTO sale_items (id,sale_id,book_id,quantity,unit_price,discount,total) VALUES ($1,$2,$3,$4,$5,$6,$7)', [itemId, saleId, item.bookId, item.quantity, item.unitPrice, item.discount, itemTotal]);
      await query('UPDATE branch_inventory SET quantity=GREATEST(0,quantity-$1),last_restocked=$2 WHERE branch_id=$3 AND book_id=$4', [item.quantity, timestamp, saleData.branchId, item.bookId]);
    }
    return newSale;
  }

  async getTransfers(branchId?: string): Promise<any[]> {
    let sql = 'SELECT * FROM stock_transfers';
    const params: any[] = [];
    if (branchId) { sql += ' WHERE from_branch_id=$1 OR to_branch_id=$1'; params.push(branchId); }
    sql += ' ORDER BY created_at DESC';
    const rows = await query(sql, params);
    return Promise.all(rows.map(async (t: any) => ({
      ...t,
      book: await queryOne('SELECT * FROM books WHERE id=$1', [t.book_id]),
      from_branch: await queryOne('SELECT * FROM branches WHERE id=$1', [t.from_branch_id]),
      to_branch: await queryOne('SELECT * FROM branches WHERE id=$1', [t.to_branch_id]),
      requester: await queryOne('SELECT id,name,role,email FROM users WHERE id=$1', [t.requested_by]),
      approver: t.approved_by ? await queryOne('SELECT id,name,role,email FROM users WHERE id=$1', [t.approved_by]) : null,
    })));
  }

  async createTransfer(transferData: any): Promise<StockTransfer> {
    const newTx: StockTransfer = { id: `txfr_${Date.now()}`, book_id: transferData.bookId, from_branch_id: transferData.fromBranchId, to_branch_id: transferData.toBranchId, quantity: transferData.quantity, status: 'pending', requested_by: transferData.requestedBy, approved_by: null, notes: transferData.notes, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    await query('INSERT INTO stock_transfers (id,book_id,from_branch_id,to_branch_id,quantity,status,requested_by,approved_by,notes,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)', [newTx.id, newTx.book_id, newTx.from_branch_id, newTx.to_branch_id, newTx.quantity, newTx.status, newTx.requested_by, null, newTx.notes, newTx.created_at, newTx.updated_at]);
    return newTx;
  }

  async updateTransferStatus(id: string, status: 'approved' | 'completed' | 'rejected', userId: string): Promise<StockTransfer> {
    const tx = await queryOne('SELECT * FROM stock_transfers WHERE id=$1', [id]);
    if (!tx) throw new Error('Transfer not found');
    const timestamp = new Date().toISOString();
    await query('UPDATE stock_transfers SET status=$1,approved_by=$2,updated_at=$3 WHERE id=$4', [status, userId, timestamp, id]);
    if (status === 'completed') {
      await query('UPDATE branch_inventory SET quantity=GREATEST(0,quantity-$1),last_restocked=$2 WHERE branch_id=$3 AND book_id=$4', [tx.quantity, timestamp, tx.from_branch_id, tx.book_id]);
      await query('UPDATE branch_inventory SET quantity=quantity+$1,last_restocked=$2 WHERE branch_id=$3 AND book_id=$4', [tx.quantity, timestamp, tx.to_branch_id, tx.book_id]);
    }
    return { ...tx, status, approved_by: userId, updated_at: timestamp };
  }

  async getExpenses(branchId?: string): Promise<Expense[]> {
    if (branchId) return query('SELECT * FROM expenses WHERE branch_id=$1 ORDER BY date DESC', [branchId]);
    return query('SELECT * FROM expenses ORDER BY date DESC');
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    if (userId === 'user_001') return query('SELECT * FROM notifications ORDER BY created_at DESC');
    return query('SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC', [userId]);
  }

  async updateNotification(id: string, isRead: boolean): Promise<Notification> {
    await query('UPDATE notifications SET is_read=$1 WHERE id=$2', [isRead, id]);
    return queryOne('SELECT * FROM notifications WHERE id=$1', [id]);
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    if (userId === 'user_001') await query('UPDATE notifications SET is_read=true');
    else await query('UPDATE notifications SET is_read=true WHERE user_id=$1', [userId]);
  }

  async createNotification(notif: Omit<Notification, 'id' | 'created_at'>): Promise<Notification> {
    const newNotif: Notification = { ...notif, id: `notif_${Date.now()}`, created_at: new Date().toISOString() };
    await query('INSERT INTO notifications (id,user_id,type,title,message,is_read,metadata,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)', [newNotif.id, newNotif.user_id, newNotif.type, newNotif.title, newNotif.message, newNotif.is_read, newNotif.metadata||'', newNotif.created_at]);
    return newNotif;
  }

  async getAuditLogs(): Promise<(AuditLog & { user?: User })[]> {
    const rows = await query('SELECT * FROM audit_logs ORDER BY created_at DESC');
    return Promise.all(rows.map(async (log: any) => ({ ...log, user: await queryOne('SELECT id,name,role,email FROM users WHERE id=$1', [log.user_id]) })));
  }

  async createAuditLog(log: Omit<AuditLog, 'id' | 'created_at'>): Promise<AuditLog> {
    const newLog: AuditLog = { ...log, id: `log_${Date.now()}`, created_at: new Date().toISOString() };
    await query('INSERT INTO audit_logs (id,user_id,action,entity_type,entity_id,details,ip_address,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)', [newLog.id, newLog.user_id, newLog.action, newLog.entity_type, newLog.entity_id||'', newLog.details||'', newLog.ip_address||'', newLog.created_at]);
    return newLog;
  }

  async getSettings(): Promise<Record<string, any>> {
    const rows = await query('SELECT * FROM system_settings');
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
    for (const [key, val] of Object.entries(settings)) {
      await query('INSERT INTO system_settings (key,value) VALUES ($1,$2) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value', [key, String(val)]);
    }
  }

  async updateUserProfile(userId: string, data: { name: string; email: string; password?: string }): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');
    const updated_at = new Date().toISOString();
    if (data.password) {
      await query('UPDATE users SET name=$1,email=$2,password_hash=$3,updated_at=$4 WHERE id=$5', [data.name, data.email, data.password, updated_at, userId]);
    } else {
      await query('UPDATE users SET name=$1,email=$2,updated_at=$3 WHERE id=$4', [data.name, data.email, updated_at, userId]);
    }
    return { ...user, name: data.name, email: data.email, updated_at };
  }

  async getDashboardStats(branchId?: string): Promise<any> {
    const allSales = await this.getSales(branchId);
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(now.getDate() - 30);
    const sixtyDaysAgo = new Date(); sixtyDaysAgo.setDate(now.getDate() - 60);
    const todaySales = allSales.filter(s => s.created_at.split('T')[0] === todayStr);
    const monthSales = allSales.filter(s => new Date(s.created_at) >= thirtyDaysAgo);
    const prevMonthSales = allSales.filter(s => { const d = new Date(s.created_at); return d >= sixtyDaysAgo && d < thirtyDaysAgo; });
    const totalRevenue = monthSales.reduce((sum, s) => sum + s.total, 0);
    const prevRevenue = prevMonthSales.reduce((sum, s) => sum + s.total, 0);
    const revenueChange = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
    const salesChange = prevMonthSales.length > 0 ? ((monthSales.length - prevMonthSales.length) / prevMonthSales.length) * 100 : 0;
    const dailyRevenue: { date: string; revenue: number; sales: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const daySales = monthSales.filter(s => s.created_at.split('T')[0] === dateStr);
      dailyRevenue.push({ date: dateStr, revenue: Math.round(daySales.reduce((sum, s) => sum + s.total, 0) * 100) / 100, sales: daySales.length });
    }
    const bookSalesMap = new Map<string, { sold: number; revenue: number }>();
    for (const s of monthSales) for (const item of (s.items || [])) {
      const ex = bookSalesMap.get(item.book_id) || { sold: 0, revenue: 0 };
      bookSalesMap.set(item.book_id, { sold: ex.sold + item.quantity, revenue: ex.revenue + item.total });
    }
    const topBooks = await Promise.all(Array.from(bookSalesMap.entries()).map(async ([bookId, stats]) => {
      const book = await queryOne('SELECT title,author FROM books WHERE id=$1', [bookId]);
      return { title: book?.title||'', author: book?.author||'', ...stats };
    }));
    topBooks.sort((a, b) => b.revenue - a.revenue);
    const branches = await this.getBranches();
    const branchPerformance = branches.map(branch => {
      const branchSales = monthSales.filter(s => s.branch_id === branch.id);
      return { name: branch.name, revenue: Math.round(branchSales.reduce((sum, s) => sum + s.total, 0) * 100) / 100, sales: branchSales.length };
    });
    const invRows = await query('SELECT bi.quantity,bi.branch_id,b.category,b.selling_price FROM branch_inventory bi JOIN books b ON bi.book_id=b.id');
    const catMap = new Map<string, { count: number; value: number }>();
    invRows.forEach((inv: any) => {
      if (branchId && inv.branch_id !== branchId) return;
      const ex = catMap.get(inv.category) || { count: 0, value: 0 };
      catMap.set(inv.category, { count: ex.count + inv.quantity, value: ex.value + inv.quantity * inv.selling_price });
    });
    const categoryBreakdown = Array.from(catMap.entries()).map(([category, stats]) => ({ category, ...stats, value: Math.round(stats.value * 100) / 100 }));
    const lowStockItems = await this.getLowStock(branchId);
    const bookCountRow = await queryOne('SELECT count(*) as count FROM books');
    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalSales: monthSales.length,
      totalBooks: parseInt(bookCountRow?.count ?? '0'),
      totalBranches: branches.length,
      revenueChange: Math.round(revenueChange * 10) / 10,
      salesChange: Math.round(salesChange * 10) / 10,
      dailyRevenue, topBooks: topBooks.slice(0, 10), branchPerformance,
      recentSales: todaySales.slice(0, 10), lowStockItems: lowStockItems.slice(0, 10), categoryBreakdown,
    };
  }

  async recordCustomerPayment(customerPhone: string, amount: number, paymentMethod: string): Promise<void> {
    const unpaidSales = await query("SELECT * FROM sales WHERE customer_phone=$1 AND amount_due>0 ORDER BY created_at ASC", [customerPhone]);
    let remaining = amount;
    for (const sale of unpaidSales) {
      if (remaining <= 0) break;
      const due = sale.amount_due;
      const paymentForSale = Math.min(remaining, due);
      const newDue = due - paymentForSale;
      const status = newDue === 0 ? 'paid' : 'partial';
      await query('UPDATE sales SET amount_paid=amount_paid+$1,amount_due=amount_due-$2,payment_status=$3 WHERE id=$4', [paymentForSale, paymentForSale, status, sale.id]);
      remaining -= paymentForSale;
    }
    await this.createAuditLog({ user_id: 'system', action: 'RECORD_CUSTOMER_PAYMENT', entity_type: 'customer', entity_id: customerPhone, details: `Recorded customer payment of Rs. ${amount.toFixed(2)} via ${paymentMethod}`, ip_address: '127.0.0.1' });
  }

  async getSuppliers(): Promise<any[]> {
    return query('SELECT * FROM suppliers ORDER BY name ASC');
  }

  async createSupplier(supplierData: any): Promise<any> {
    const id = `sup_${Date.now()}`;
    const created_at = new Date().toISOString();
    await query('INSERT INTO suppliers (id,name,phone,email,address,created_at) VALUES ($1,$2,$3,$4,$5,$6)', [id, supplierData.name, supplierData.phone||'', supplierData.email||'', supplierData.address||'', created_at]);
    return { id, ...supplierData, created_at };
  }

  async getPurchaseOrders(branchId?: string): Promise<any[]> {
    let sql = 'SELECT po.*,s.name as supplier_name,b.name as branch_name FROM purchase_orders po JOIN suppliers s ON po.supplier_id=s.id JOIN branches b ON po.branch_id=b.id';
    const params: any[] = [];
    if (branchId) { sql += ' WHERE po.branch_id=$1'; params.push(branchId); }
    sql += ' ORDER BY po.date DESC';
    const pos = await query(sql, params);
    return Promise.all(pos.map(async (po: any) => {
      const items = await query('SELECT poi.*,b.title,b.isbn FROM purchase_order_items poi JOIN books b ON poi.book_id=b.id WHERE poi.purchase_order_id=$1', [po.id]);
      return { ...po, items };
    }));
  }

  async createPurchaseOrder(poData: any): Promise<any> {
    const id = `po_${Date.now()}`;
    const created_at = new Date().toISOString();
    await query('INSERT INTO purchase_orders (id,supplier_id,branch_id,invoice_no,date,subtotal,discount,total,amount_paid,amount_due,payment_method,status,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)', [id, poData.supplierId, poData.branchId, poData.invoiceNo||'', poData.date, poData.subtotal, poData.discount||0, poData.total, poData.amountPaid||0, poData.amountDue||0, poData.paymentMethod, poData.status, created_at]);
    for (let idx = 0; idx < poData.items.length; idx++) {
      const item = poData.items[idx];
      await query('INSERT INTO purchase_order_items (id,purchase_order_id,book_id,quantity,cost_price,discount,total) VALUES ($1,$2,$3,$4,$5,$6,$7)', [`poi_${Date.now()}_${idx}`, id, item.bookId, item.quantity, item.costPrice, item.discount||0, item.total]);
      await query('INSERT INTO branch_inventory (id,book_id,branch_id,quantity,reorder_level,last_restocked) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT(book_id,branch_id) DO UPDATE SET quantity=branch_inventory.quantity+EXCLUDED.quantity,last_restocked=EXCLUDED.last_restocked', [`inv_${Date.now()}`, item.bookId, poData.branchId, item.quantity, 3, poData.date]);
    }
    return { id, ...poData, created_at };
  }

  async importSuppliers(suppliers: any[]): Promise<void> {
    for (const s of suppliers) {
      await query('INSERT INTO suppliers (id,name,phone,email,address,created_at) VALUES ($1,$2,$3,$4,$5,$6)', [`supplier_${Date.now()}_${Math.random().toString(36).substring(2,7)}`, s.name, s.phone||'', s.email||'', s.address||'', new Date().toISOString()]);
    }
  }

  async importInventory(branchId: string, items: any[]): Promise<void> {
    const now = new Date().toISOString();
    for (const item of items) {
      let book = await queryOne('SELECT * FROM books WHERE isbn=$1', [item.isbn]);
      let bookId = '';
      if (book) {
        bookId = book.id;
        await query('UPDATE books SET barcode=$1,title=$2,author=$3,publisher=$4,category=$5,description=$6,cost_price=$7,selling_price=$8,updated_at=$9 WHERE id=$10', [item.barcode, item.title, item.author, item.publisher||'', item.category||'Fiction', item.description||'', item.cost_price, item.selling_price, now, bookId]);
      } else {
        bookId = `book_${Date.now()}_${Math.random().toString(36).substring(2,7)}`;
        await query('INSERT INTO books (id,isbn,barcode,title,author,publisher,category,description,cost_price,selling_price,image_url,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)', [bookId, item.isbn, item.barcode, item.title, item.author, item.publisher||'', item.category||'Fiction', item.description||'', item.cost_price, item.selling_price, '', now, now]);
      }
      await query('INSERT INTO branch_inventory (id,branch_id,book_id,quantity,reorder_level,last_restocked) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT(book_id,branch_id) DO UPDATE SET quantity=EXCLUDED.quantity,reorder_level=EXCLUDED.reorder_level,last_restocked=EXCLUDED.last_restocked', [`inv_${Date.now()}`, branchId, bookId, item.quantity, item.reorder_level, now]);
    }
  }

  async importCustomers(customers: any[]): Promise<void> {
    const now = new Date().toISOString();
    for (const c of customers) {
      const total = c.totalSpent||0, due = c.totalDue||0, paid = Math.max(0, total - due);
      const paymentStatus = due > 0 ? (paid === 0 ? 'unpaid' : 'partial') : 'paid';
      await query('INSERT INTO sales (id,branch_id,cashier_id,customer_name,customer_email,customer_phone,subtotal,discount_amount,discount_type,tax_amount,total,payment_method,status,notes,amount_paid,amount_due,payment_status,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)', [`sale_${Date.now()}_${Math.random().toString(36).substring(2,7)}`, 'branch_001', 'system', c.name, c.email||'', c.phone||'', total, 0, 'percentage', 0, total, due > 0 ? 'credit' : 'cash', 'completed', 'Imported profile', paid, due, paymentStatus, now]);
    }
  }
}

export const postgresDb = new PostgresDatabase();
export default postgresDb;
