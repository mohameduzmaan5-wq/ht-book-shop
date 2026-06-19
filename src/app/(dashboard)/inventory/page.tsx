'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, Download, Edit3, ArrowUpDown, ArrowUp, ArrowDown,
  Package, AlertTriangle, XCircle, CheckCircle, X, ArrowRightLeft,
  BookOpen, DollarSign, Boxes, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { apiClient as db } from '@/lib/apiClient';
import { useAppStore, useToastStore, useAuthStore } from '@/store';
import type { BranchInventory, Book } from '@/types';
import CsvImportModal from '@/components/CsvImportModal';

// ── Constants ──────────────────────────────────────────
const ITEMS_PER_PAGE = 20;
const CATEGORIES = [
  'All', 'Fiction', 'Non-Fiction', 'Science', 'Technology',
  'History', 'Philosophy', 'Business', 'Self-Help',
  'Children', 'Poetry', 'Biography', 'Art',
];

type SortField = 'title' | 'author' | 'isbn' | 'category' | 'cost_price' | 'selling_price' | 'quantity' | 'reorder_level';
type SortDir = 'asc' | 'desc';

interface InventoryRow extends BranchInventory {
  book?: Book;
}

// ── Add-Book Modal ────────────────────────────────────
function AddBookModal({ onClose, onAdd }: { onClose: () => void; onAdd: () => void }) {
  const { addToast } = useToastStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '', author: '', isbn: '', barcode: '', publisher: '',
    category: 'Fiction', cost_price: '', selling_price: '', description: '',
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    const cost = parseFloat(form.cost_price);
    const selling = parseFloat(form.selling_price);

    if (!form.title || !form.author || !form.isbn || !form.barcode || isNaN(cost) || isNaN(selling)) {
      addToast({
        type: 'warning',
        title: 'Validation Error',
        message: 'Please fill in all required fields (Title, Author, ISBN, Barcode, Prices).',
      });
      return;
    }

    setLoading(true);
    try {
      await db.createBook({
        title: form.title,
        author: form.author,
        isbn: form.isbn,
        barcode: form.barcode,
        publisher: form.publisher,
        category: form.category,
        cost_price: cost,
        selling_price: selling,
        description: form.description,
        image_url: '',
      });
      
      addToast({
        type: 'success',
        title: 'Book Created',
        message: `Successfully added "${form.title}" and initialized stock.`,
      });
      onAdd();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Error',
        message: err.message || 'Failed to create book.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6"
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Add New Book</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Title" value={form.title} onChange={set('title')} placeholder="Book title" />
            <Field label="Author" value={form.author} onChange={set('author')} placeholder="Author name" />
          </div>
          {/* Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="ISBN" value={form.isbn} onChange={set('isbn')} placeholder="978-x-xx-xxxxxx-x" />
            <Field label="Barcode" value={form.barcode} onChange={set('barcode')} placeholder="Barcode number" />
          </div>
          {/* Row 3 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Publisher" value={form.publisher} onChange={set('publisher')} placeholder="Publisher name" />
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1.5">Category</label>
              <select
                value={form.category} onChange={set('category')}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
              >
                {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c} className="bg-[#12121A]">{c}</option>)}
              </select>
            </div>
          </div>
          {/* Row 4 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Cost Price (Rs.)" value={form.cost_price} onChange={set('cost_price')} placeholder="0.00" type="number" />
            <Field label="Selling Price (Rs.)" value={form.selling_price} onChange={set('selling_price')} placeholder="0.00" type="number" />
          </div>
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-white/60 mb-1.5">Description</label>
            <textarea
              value={form.description} onChange={set('description')} placeholder="Book description..."
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
          <button onClick={onClose} disabled={loading} className="px-5 py-2.5 rounded-xl bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all text-sm font-medium">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading} className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white transition-all text-sm font-medium shadow-lg shadow-brand-600/25">
            {loading ? 'Creating...' : 'Add Book'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Edit-Book Modal ───────────────────────────────────
function EditBookModal({ item, onClose, onSave }: { item: InventoryRow; onClose: () => void; onSave: () => void }) {
  const { addToast } = useToastStore();
  const [loading, setLoading] = useState(false);
  const book = item.book;
  const [form, setForm] = useState({
    title: book?.title || '',
    author: book?.author || '',
    isbn: book?.isbn || '',
    barcode: book?.barcode || '',
    publisher: book?.publisher || '',
    category: book?.category || 'Fiction',
    cost_price: book?.cost_price.toString() || '',
    selling_price: book?.selling_price.toString() || '',
    description: book?.description || '',
    quantity: item.quantity.toString(),
    reorder_level: item.reorder_level.toString(),
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    const cost = parseFloat(form.cost_price);
    const selling = parseFloat(form.selling_price);
    const quantity = parseInt(form.quantity, 10);
    const reorder = parseInt(form.reorder_level, 10);

    if (!form.title || !form.author || !form.isbn || !form.barcode || isNaN(cost) || isNaN(selling) || isNaN(quantity) || isNaN(reorder)) {
      addToast({
        type: 'warning',
        title: 'Validation Error',
        message: 'Please fill in all required fields correctly.',
      });
      return;
    }

    setLoading(true);
    try {
      if (book) {
        // Update product catalog details
        await db.updateBook(book.id, {
          title: form.title,
          author: form.author,
          isbn: form.isbn,
          barcode: form.barcode,
          publisher: form.publisher,
          category: form.category,
          cost_price: cost,
          selling_price: selling,
          description: form.description,
        });

        // Update branch inventory stock and reorder point
        await db.updateInventoryDetails(item.branch_id, book.id, quantity, reorder);
        
        addToast({
          type: 'success',
          title: 'Product Updated',
          message: `Successfully updated "${form.title}" details and stock levels.`,
        });
        onSave();
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Error',
        message: err.message || 'Failed to update product.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6"
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Edit Product</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Title" value={form.title} onChange={set('title')} placeholder="Book title" />
            <Field label="Author" value={form.author} onChange={set('author')} placeholder="Author name" />
          </div>
          {/* Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="ISBN" value={form.isbn} onChange={set('isbn')} placeholder="978-x-xx-xxxxxx-x" />
            <Field label="Barcode" value={form.barcode} onChange={set('barcode')} placeholder="Barcode number" />
          </div>
          {/* Row 3 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Publisher" value={form.publisher} onChange={set('publisher')} placeholder="Publisher name" />
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1.5">Category</label>
              <select
                value={form.category} onChange={set('category')}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
              >
                {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c} className="bg-[#12121A]">{c}</option>)}
              </select>
            </div>
          </div>
          {/* Row 4 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Cost Price (Rs.)" value={form.cost_price} onChange={set('cost_price')} placeholder="0.00" type="number" />
            <Field label="Selling Price (Rs.)" value={form.selling_price} onChange={set('selling_price')} placeholder="0.00" type="number" />
          </div>
          {/* Row 5 - Stock level */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-white/5 pt-4">
            <Field label="Stock Quantity" value={form.quantity} onChange={set('quantity')} placeholder="0" type="number" />
            <Field label="Reorder Level" value={form.reorder_level} onChange={set('reorder_level')} placeholder="3" type="number" />
          </div>
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-white/60 mb-1.5">Description</label>
            <textarea
              value={form.description} onChange={set('description')} placeholder="Book description..."
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
          <button onClick={onClose} disabled={loading} className="px-5 py-2.5 rounded-xl bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all text-sm font-medium">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading} className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white transition-all text-sm font-medium shadow-lg shadow-brand-600/25">
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-white/60 mb-1.5">{label}</label>
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
      />
    </div>
  );
}

// ── Status Badge ──────────────────────────────────────
function StockBadge({ qty, reorder }: { qty: number; reorder: number }) {
  if (qty === 0) return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-400 text-xs font-medium">
      <XCircle size={12} /> Out of Stock
    </span>
  );
  if (qty <= reorder) return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 text-xs font-medium">
      <AlertTriangle size={12} /> Low Stock
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-medium">
      <CheckCircle size={12} /> In Stock
    </span>
  );
}

// ── Main Page ─────────────────────────────────────────
export default function InventoryPage() {
  const selectedBranch = useAppStore(s => s.selectedBranch);
  const user = useAuthStore(s => s.user);
  const branchId = selectedBranch || 'branch_001';

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryRow | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Data ────────
  const [rawItems, setRawItems] = useState<InventoryRow[]>([]);

  const fetchInventory = async () => {
    try {
      const data = await db.getInventory(branchId, search || undefined, category === 'All' ? undefined : category);
      setRawItems(data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load inventory:', err);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchInventory();
  }, [branchId, search, category]);

  // Real-time listener
  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail.type === 'inventory') {
        fetchInventory();
      }
    };
    window.addEventListener('db-update', handleUpdate);
    return () => window.removeEventListener('db-update', handleUpdate);
  }, [branchId, search, category]);

  const totalItems = useMemo(() => rawItems.reduce((sum, i) => sum + i.quantity, 0), [rawItems]);
  const totalValue = useMemo(() => rawItems.reduce((sum, i) => sum + i.quantity * (i.book?.selling_price || 0), 0), [rawItems]);
  const lowStockCount = useMemo(() => rawItems.filter(i => i.quantity <= i.reorder_level && i.quantity > 0).length, [rawItems]);
  const outOfStockCount = useMemo(() => rawItems.filter(i => i.quantity === 0).length, [rawItems]);

  // ── Sort ────────
  const sorted = useMemo(() => {
    const arr = [...rawItems];
    arr.sort((a, b) => {
      let va: string | number = '';
      let vb: string | number = '';
      switch (sortField) {
        case 'title': va = a.book?.title ?? ''; vb = b.book?.title ?? ''; break;
        case 'author': va = a.book?.author ?? ''; vb = b.book?.author ?? ''; break;
        case 'isbn': va = a.book?.isbn ?? ''; vb = b.book?.isbn ?? ''; break;
        case 'category': va = a.book?.category ?? ''; vb = b.book?.category ?? ''; break;
        case 'cost_price': va = a.book?.cost_price ?? 0; vb = b.book?.cost_price ?? 0; break;
        case 'selling_price': va = a.book?.selling_price ?? 0; vb = b.book?.selling_price ?? 0; break;
        case 'quantity': va = a.quantity; vb = b.quantity; break;
        case 'reorder_level': va = a.reorder_level; vb = b.reorder_level; break;
      }
      if (typeof va === 'string') {
        return sortDir === 'asc' ? va.localeCompare(vb as string) : (vb as string).localeCompare(va);
      }
      return sortDir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });
    return arr;
  }, [rawItems, sortField, sortDir]);

  // ── Pagination ──
  const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE);
  const paginated = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return sorted.slice(start, start + ITEMS_PER_PAGE);
  }, [sorted, page]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
    setPage(1);
  };

  const handleCategoryChange = useCallback((c: string) => {
    setCategory(c);
    setPage(1);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  }, []);

  const exportCSV = useCallback(() => {
    const header = 'Title,Author,ISBN,Category,Cost Price,Selling Price,Stock,Reorder Level,Status\n';
    const rows = sorted.map(i => {
      const b = i.book;
      const status = i.quantity === 0 ? 'Out of Stock' : i.quantity <= i.reorder_level ? 'Low Stock' : 'In Stock';
      return `"${b?.title}","${b?.author}","${b?.isbn}","${b?.category}",${b?.cost_price},${b?.selling_price},${i.quantity},${i.reorder_level},${status}`;
    }).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'inventory.csv'; a.click();
    URL.revokeObjectURL(url);
  }, [sorted]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown size={14} className="text-white/30" />;
    return sortDir === 'asc' ? <ArrowUp size={14} className="text-brand-400" /> : <ArrowDown size={14} className="text-brand-400" />;
  };

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────── */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Inventory Management</h1>
          <p className="text-white/50 mt-1">Track and manage your book inventory across branches</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all text-sm font-medium">
            <Download size={16} /> Export CSV
          </button>
          {user?.role !== 'cashier' && (
            <>
              <button onClick={() => setShowImportModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all text-sm font-medium">
                <Download size={16} /> Import CSV
              </button>
              <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white transition-all text-sm font-medium shadow-lg shadow-brand-600/25">
                <Plus size={16} /> Add Book
              </button>
            </>
          )}
        </div>
      </motion.div>

      {/* ── Stat Cards ─────────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Boxes size={20} />} label="Total Items" value={loading ? '...' : totalItems.toLocaleString()} color="indigo" />
        <StatCard icon={<DollarSign size={20} />} label="Inventory Value" value={loading ? '...' : `Rs. ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} color="emerald" />
        <StatCard icon={<AlertTriangle size={20} />} label="Low Stock" value={loading ? '...' : lowStockCount.toString()} color="amber" />
        <StatCard icon={<XCircle size={20} />} label="Out of Stock" value={loading ? '...' : outOfStockCount.toString()} color="rose" />
      </motion.div>

      {/* ── Search ─────────────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
        <input
          value={search} onChange={handleSearchChange}
          placeholder="Search by title, author, or ISBN..."
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
        />
      </motion.div>

      {/* ── Category Tabs ──────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="flex flex-wrap gap-2">
        {CATEGORIES.map(c => (
          <button
            key={c}
            onClick={() => handleCategoryChange(c)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              category === c
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/25'
                : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10 border border-white/10'
            }`}
          >
            {c}
          </button>
        ))}
      </motion.div>

      {/* ── Table ──────────────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-white/40">
              <div className="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin mb-4" />
              <p className="text-sm">Loading inventory data...</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  {([
                    ['title', 'Book Title'],
                    ['author', 'Author'],
                    ['isbn', 'ISBN'],
                    ['category', 'Category'],
                    ['cost_price', 'Cost'],
                    ['selling_price', 'Price'],
                    ['quantity', 'Stock'],
                    ['reorder_level', 'Reorder'],
                  ] as [SortField, string][]).map(([f, label]) => (
                    <th key={f} className="text-left px-4 py-4 text-white/50 font-medium cursor-pointer hover:text-white transition-colors select-none" onClick={() => toggleSort(f)}>
                      <span className="inline-flex items-center gap-1.5">{label} <SortIcon field={f} /></span>
                    </th>
                  ))}
                  <th className="text-left px-4 py-4 text-white/50 font-medium">Status</th>
                  <th className="text-left px-4 py-4 text-white/50 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {paginated.map((item, idx) => {
                    const b = item.book;
                    const isLow = item.quantity > 0 && item.quantity <= item.reorder_level;
                    return (
                      <motion.tr
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ delay: idx * 0.02 }}
                        className={`border-b border-white/5 hover:bg-white/[0.03] transition-colors ${isLow ? 'bg-amber-500/[0.04]' : ''}`}
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-brand-600/20 flex items-center justify-center flex-shrink-0">
                              <BookOpen size={16} className="text-brand-400" />
                            </div>
                            <span className="text-white font-medium truncate max-w-[200px]">{b?.title}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-white/70">{b?.author}</td>
                        <td className="px-4 py-3.5 text-white/50 font-mono text-xs">{b?.isbn}</td>
                        <td className="px-4 py-3.5">
                          <span className="px-2.5 py-1 rounded-lg bg-white/5 text-white/60 text-xs font-medium">{b?.category}</span>
                        </td>
                        <td className="px-4 py-3.5 text-white/60">Rs. {b?.cost_price.toFixed(2)}</td>
                        <td className="px-4 py-3.5 text-white font-medium">Rs. {b?.selling_price.toFixed(2)}</td>
                        <td className="px-4 py-3.5">
                          <span className={`font-semibold ${item.quantity === 0 ? 'text-rose-400' : item.quantity <= item.reorder_level ? 'text-amber-400' : 'text-white'}`}>
                            {item.quantity}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-white/50">{item.reorder_level}</td>
                        <td className="px-4 py-3.5"><StockBadge qty={item.quantity} reorder={item.reorder_level} /></td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1">
                            {user?.role !== 'cashier' && (
                              <button onClick={() => setEditingItem(item)} className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors" title="Edit">
                                <Edit3 size={15} />
                              </button>
                            )}
                            <button className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-brand-400 transition-colors" title="Transfer">
                              <ArrowRightLeft size={15} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>

                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={10} className="text-center py-16 text-white/40">
                      <Package size={40} className="mx-auto mb-3 text-white/20" />
                      <p className="text-lg font-medium">No items found</p>
                      <p className="text-sm mt-1">Try adjusting your search or filter criteria</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Pagination ─── */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-4 border-t border-white/10">
            <p className="text-sm text-white/40">
              Showing {((page - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(page * ITEMS_PER_PAGE, sorted.length)} of {sorted.length} items
            </p>
            <div className="flex items-center gap-1">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white/60 hover:text-white transition-colors">
                <ChevronLeft size={18} />
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let n: number;
                if (totalPages <= 7) n = i + 1;
                else if (page <= 4) n = i + 1;
                else if (page >= totalPages - 3) n = totalPages - 6 + i;
                else n = page - 3 + i;
                return (
                  <button
                    key={n} onClick={() => setPage(n)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                      n === page ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/25' : 'text-white/50 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {n}
                  </button>
                );
              })}
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white/60 hover:text-white transition-colors">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* ── Modal ──────────────── */}
      <AnimatePresence>
        {showModal && (
          <AddBookModal 
            onClose={() => setShowModal(false)} 
            onAdd={() => {
              setShowModal(false);
              fetchInventory();
            }}
          />
        )}
        {editingItem && (
          <EditBookModal
            item={editingItem}
            onClose={() => setEditingItem(null)}
            onSave={() => {
              setEditingItem(null);
              fetchInventory();
            }}
          />
        )}
        {showImportModal && (
          <CsvImportModal
            type="inventory"
            branchId={branchId}
            onClose={() => setShowImportModal(false)}
            onSuccess={() => {
              setShowImportModal(false);
              fetchInventory();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────
function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    indigo: 'stat-glow-indigo text-brand-400',
    emerald: 'stat-glow-emerald text-emerald-400',
    amber: 'stat-glow-amber text-amber-400',
    rose: 'stat-glow-rose text-rose-400',
  };
  const iconBg: Record<string, string> = {
    indigo: 'bg-brand-600/20',
    emerald: 'bg-emerald-500/20',
    amber: 'bg-amber-500/20',
    rose: 'bg-rose-500/20',
  };
  return (
    <div className={`glass-card p-5 ${colors[color]?.split(' ')[0] ?? ''}`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl ${iconBg[color]} flex items-center justify-center ${colors[color]?.split(' ')[1] ?? ''}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-white/50">{label}</p>
          <p className="text-xl font-bold text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}
