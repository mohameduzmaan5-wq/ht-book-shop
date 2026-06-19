'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck,
  Plus,
  Search,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  CreditCard,
  CheckCircle,
  FileText,
  X,
  ChevronDown,
  ChevronUp,
  Trash2,
  Store,
  List,
  PlusCircle,
  AlertTriangle,
  MapPin,
  FileSpreadsheet,
} from 'lucide-react';
import { apiClient as db } from '@/lib/apiClient';
import { useAppStore, useToastStore, useAuthStore } from '@/store';
import type { Book } from '@/types';
import CsvImportModal from '@/components/CsvImportModal';

// Formatting helper for LKR
function fmtCurrency(n: number) {
  return `Rs. ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface PurchaseItem {
  bookId: string;
  bookTitle: string;
  quantity: number;
  costPrice: number;
  discount: number;
  total: number;
}

export default function SuppliersPage() {
  const { selectedBranch } = useAppStore();
  const { user } = useAuthStore();
  const { addToast } = useToastStore();

  const [activeTab, setActiveTab] = useState<'purchases' | 'suppliers'>('purchases');
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  // Supplier form state
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [supName, setSupName] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supAddress, setSupAddress] = useState('');
  const [supSubmitting, setSupSubmitting] = useState(false);

  // Inward Purchase form state
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [poSubmitting, setPoSubmitting] = useState(false);

  // Selected book fields for adding item
  const [currentBookId, setCurrentBookId] = useState('');
  const [currentQty, setCurrentQty] = useState<number>(1);
  const [currentCost, setCurrentCost] = useState<number>(0);
  const [currentDiscount, setCurrentDiscount] = useState<number>(0);

  // Inward Purchase payment state
  const [poAmountPaid, setPoAmountPaid] = useState<number>(0);
  const [poPaymentMethod, setPoPaymentMethod] = useState<'cash' | 'card' | 'check' | 'bank_transfer'>('cash');
  const [poStatus, setPoStatus] = useState<'paid' | 'unpaid' | 'check_pending'>('paid');

  // Expanded purchase order ID for details view
  const [expandedPoId, setExpandedPoId] = useState<string | null>(null);

  // Load active branch
  const activeBranchId = useMemo(() => {
    if (user?.role === 'super_admin') {
      return selectedBranch || 'branch_001';
    }
    return user?.branch_id || 'branch_001';
  }, [user, selectedBranch]);

  const fetchPageData = async () => {
    try {
      const [supsData, posData, booksData] = await Promise.all([
        db.getSuppliers(),
        db.getPurchaseOrders(activeBranchId),
        db.getBooks(),
      ]);
      setSuppliers(supsData);
      setPurchaseOrders(posData);
      setBooks(booksData);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch suppliers/purchase orders data:', err);
    }
  };

  useEffect(() => {
    fetchPageData();
  }, [activeBranchId]);

  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail?.type === 'suppliers' || e.detail?.type === 'purchase_orders' || e.detail?.type === 'inventory') {
        fetchPageData();
      }
    };
    window.addEventListener('db-update', handleUpdate);
    return () => window.removeEventListener('db-update', handleUpdate);
  }, [activeBranchId]);

  // Restrict access to cashiers
  if (user?.role !== 'super_admin' && user?.role !== 'branch_manager') {
    return (
      <div className="flex h-[calc(100vh-100px)] w-full flex-col items-center justify-center p-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 mb-4 border border-rose-500/20">
          <Truck className="h-8 w-8 text-rose-400" />
        </div>
        <h3 className="text-xl font-bold text-white">Access Denied</h3>
        <p className="text-sm text-white/40 mt-1 max-w-sm">
          You need administrator or branch manager privileges to access the suppliers and inward stock ledger.
        </p>
      </div>
    );
  }

  // Pre-fill cost price when book changes
  const handleBookSelect = (bookId: string) => {
    setCurrentBookId(bookId);
    const selectedBook = books.find((b) => b.id === bookId);
    if (selectedBook) {
      setCurrentCost(selectedBook.cost_price);
    }
  };

  // Add item to purchase bill
  const handleAddItem = () => {
    if (!currentBookId) {
      addToast({ type: 'warning', title: 'Select Book', message: 'Please select a book to add.' });
      return;
    }
    if (currentQty <= 0) {
      addToast({ type: 'warning', title: 'Invalid Quantity', message: 'Quantity must be at least 1.' });
      return;
    }

    const selectedBook = books.find((b) => b.id === currentBookId);
    if (!selectedBook) return;

    // Check if item already exists
    const existsIdx = items.findIndex((i) => i.bookId === currentBookId);
    const lineTotal = currentCost * currentQty - currentDiscount;

    if (existsIdx > -1) {
      const updated = [...items];
      updated[existsIdx].quantity += currentQty;
      updated[existsIdx].discount += currentDiscount;
      updated[existsIdx].total = updated[existsIdx].costPrice * updated[existsIdx].quantity - updated[existsIdx].discount;
      setItems(updated);
    } else {
      setItems([
        ...items,
        {
          bookId: currentBookId,
          bookTitle: selectedBook.title,
          quantity: currentQty,
          costPrice: currentCost,
          discount: currentDiscount,
          total: lineTotal,
        },
      ]);
    }

    // Reset current selection form
    setCurrentBookId('');
    setCurrentQty(1);
    setCurrentCost(0);
    setCurrentDiscount(0);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, item) => sum + item.costPrice * item.quantity, 0);
  const totalDiscount = items.reduce((sum, item) => sum + item.discount, 0);
  const totalAmount = subtotal - totalDiscount;

  // Handle PO submit
  const handleCreatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSupplierId) {
      addToast({ type: 'error', title: 'Supplier Required', message: 'Please select a supplier.' });
      return;
    }
    if (items.length === 0) {
      addToast({ type: 'error', title: 'No Items', message: 'Please add at least one book to the bill.' });
      return;
    }

    setPoSubmitting(true);

    try {
      const amountDue = Math.max(0, totalAmount - poAmountPaid);
      const poData = {
        supplierId: selectedSupplierId,
        branchId: activeBranchId,
        invoiceNo: invoiceNo,
        date: purchaseDate,
        subtotal: subtotal,
        discount: totalDiscount,
        total: totalAmount,
        amountPaid: poAmountPaid,
        amountDue: amountDue,
        paymentMethod: poPaymentMethod,
        status: poStatus,
        items: items,
      };

      await db.createPurchaseOrder(poData);

      addToast({
        type: 'success',
        title: 'Purchase Order Logged',
        message: 'Stocks updated and purchase registered successfully.',
      });

      // Clear form
      setSelectedSupplierId('');
      setInvoiceNo('');
      setItems([]);
      setPoAmountPaid(0);
      setPoStatus('paid');
      setPoPaymentMethod('cash');

      // Reload lists
      fetchPageData();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Logging Failed',
        message: err.message || 'Could not log purchase order.',
      });
    } finally {
      setPoSubmitting(false);
    }
  };

  // Handle Supplier Registration
  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim()) return;

    setSupSubmitting(true);
    try {
      await db.createSupplier({
        name: supName,
        phone: supPhone,
        email: supEmail,
        address: supAddress,
      });

      addToast({
        type: 'success',
        title: 'Supplier Added',
        message: `Registered "${supName}" inside registry.`,
      });

      // Reset
      setSupName('');
      setSupPhone('');
      setSupEmail('');
      setSupAddress('');
      setShowAddSupplierModal(false);
      
      // Reload
      fetchPageData();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Error',
        message: err.message || 'Could not register supplier.',
      });
    } finally {
      setSupSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Supplier Purchases & Registry</h1>
          <p className="text-white/40 mt-1">
            Log inward publisher stock shipments, track cost pricing, and manage supplier listings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all text-sm font-medium"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Import CSV
          </button>
          <button
            onClick={() => setShowAddSupplierModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20"
          >
            <PlusCircle className="w-4 h-4" />
            Add Supplier
          </button>
        </div>
      </div>

      {/* Tabs bar */}
      <div className="flex gap-2 border-b border-white/5 pb-px">
        <button
          onClick={() => setActiveTab('purchases')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'purchases'
              ? 'border-indigo-500 text-indigo-400 font-bold'
              : 'border-transparent text-white/50 hover:text-white/80'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" /> Inward Stock Ledger (Purchases)
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'suppliers'
              ? 'border-indigo-500 text-indigo-400 font-bold'
              : 'border-transparent text-white/50 hover:text-white/80'
          }`}
        >
          <Truck className="w-4 h-4" /> Suppliers Registry
        </button>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {activeTab === 'purchases' ? (
            <motion.div
              key="purchases"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start"
            >
              {/* Log shipment form (Left) */}
              <div className="xl:col-span-2 glass-card p-6 space-y-6">
                <div className="border-b border-white/5 pb-4">
                  <h2 className="text-lg font-bold text-white">Record Inward Stock</h2>
                  <p className="text-xs text-white/40 mt-1">Log shipments from publishers to increase inventory stocks.</p>
                </div>

                <form onSubmit={handleCreatePurchase} className="space-y-6">
                  {/* Metadata Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-white/50 mb-1.5">Supplier / Publisher *</label>
                      <select
                        value={selectedSupplierId}
                        onChange={(e) => setSelectedSupplierId(e.target.value)}
                        required
                        className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] px-3.5 py-2.5 text-sm text-white focus:border-indigo-500/50 outline-none animate-none"
                      >
                        <option value="" className="bg-[#12121A]">Select Supplier</option>
                        {suppliers.map((s) => (
                          <option key={s.id} value={s.id} className="bg-[#12121A]">{s.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-white/50 mb-1.5">Invoice / Bill Number</label>
                      <input
                        type="text"
                        placeholder="e.g. BILL-9204"
                        value={invoiceNo}
                        onChange={(e) => setInvoiceNo(e.target.value)}
                        className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] px-3.5 py-2.5 text-sm text-white placeholder-white/20 focus:border-indigo-500/50 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-white/50 mb-1.5">Purchase Date</label>
                      <input
                        type="date"
                        value={purchaseDate}
                        onChange={(e) => setPurchaseDate(e.target.value)}
                        required
                        className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] px-3.5 py-2.5 text-sm text-white focus:border-indigo-500/50 outline-none"
                      />
                    </div>
                  </div>

                  {/* Add items builder */}
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-4">
                    <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider">Add Books to Bill</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                      <div className="md:col-span-5">
                        <label className="block text-[10px] font-medium text-white/40 mb-1">Book / Title</label>
                        <select
                          value={currentBookId}
                          onChange={(e) => handleBookSelect(e.target.value)}
                          className="w-full rounded-lg bg-white/[0.04] border border-white/[0.08] px-3 py-2 text-xs text-white focus:border-indigo-500/50 outline-none"
                        >
                          <option value="" className="bg-[#12121A]">Select a book</option>
                          {books.map((b) => (
                            <option key={b.id} value={b.id} className="bg-[#12121A]">
                              {b.title} ({b.author})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-medium text-white/40 mb-1">Qty</label>
                        <input
                          type="number"
                          min="1"
                          value={currentQty || ''}
                          onChange={(e) => setCurrentQty(Number(e.target.value))}
                          className="w-full rounded-lg bg-white/[0.04] border border-white/[0.08] px-3 py-2 text-xs text-white text-right outline-none focus:border-indigo-500/50"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-medium text-white/40 mb-1">Cost Price (Rs.)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={currentCost || ''}
                          onChange={(e) => setCurrentCost(Number(e.target.value))}
                          className="w-full rounded-lg bg-white/[0.04] border border-white/[0.08] px-3 py-2 text-xs text-white text-right outline-none focus:border-indigo-500/50"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-medium text-white/40 mb-1">Discount (Rs.)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={currentDiscount || ''}
                          onChange={(e) => setCurrentDiscount(Number(e.target.value))}
                          className="w-full rounded-lg bg-white/[0.04] border border-white/[0.08] px-3 py-2 text-xs text-white text-right outline-none focus:border-indigo-500/50"
                        />
                      </div>

                      <div className="md:col-span-1">
                        <button
                          type="button"
                          onClick={handleAddItem}
                          className="w-full flex h-8 items-center justify-center rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/10 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Items List Table */}
                  {items.length > 0 && (
                    <div className="border border-white/5 rounded-xl overflow-hidden bg-white/[0.01]">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-white/[0.03] border-b border-white/5 text-white/40 font-semibold uppercase tracking-wider">
                            <th className="p-3">Book Title</th>
                            <th className="p-3 text-right">Qty</th>
                            <th className="p-3 text-right">Cost Price</th>
                            <th className="p-3 text-right">Discount</th>
                            <th className="p-3 text-right">Total</th>
                            <th className="p-3 text-center"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-white/70">
                          {items.map((item, index) => (
                            <tr key={index} className="hover:bg-white/[0.01]">
                              <td className="p-3 font-medium text-white">{item.bookTitle}</td>
                              <td className="p-3 text-right">{item.quantity}</td>
                              <td className="p-3 text-right">{fmtCurrency(item.costPrice)}</td>
                              <td className="p-3 text-right">{fmtCurrency(item.discount)}</td>
                              <td className="p-3 text-right font-bold text-white">{fmtCurrency(item.total)}</td>
                              <td className="p-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(index)}
                                  className="p-1 rounded-md text-white/30 hover:bg-rose-500/15 hover:text-rose-400 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Invoice Payment Settings */}
                  {items.length > 0 && (
                    <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-white/50 mb-1.5">Amount Paid (Rs.)</label>
                        <input
                          type="number"
                          min="0"
                          max={totalAmount}
                          step="0.01"
                          value={poAmountPaid || ''}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setPoAmountPaid(val);
                            if (val === totalAmount) setPoStatus('paid');
                            else if (val > 0) setPoStatus('check_pending');
                          }}
                          className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] px-3.5 py-2.5 text-sm text-white text-right outline-none focus:border-indigo-500/50 font-semibold text-emerald-400"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-white/50 mb-1.5">Payment Method</label>
                        <select
                          value={poPaymentMethod}
                          onChange={(e: any) => setPoPaymentMethod(e.target.value)}
                          className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] px-3.5 py-2.5 text-sm text-white focus:border-indigo-500/50 outline-none"
                        >
                          <option value="cash" className="bg-[#12121A]">Cash</option>
                          <option value="card" className="bg-[#12121A]">Card</option>
                          <option value="check" className="bg-[#12121A]">Check (Cheque)</option>
                          <option value="bank_transfer" className="bg-[#12121A]">Bank Transfer</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-white/50 mb-1.5">Payment Status</label>
                        <select
                          value={poStatus}
                          onChange={(e: any) => setPoStatus(e.target.value)}
                          className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] px-3.5 py-2.5 text-sm text-white focus:border-indigo-500/50 outline-none"
                        >
                          <option value="paid" className="bg-[#12121A]">Fully Paid</option>
                          <option value="unpaid" className="bg-[#12121A]">Unpaid (Credit)</option>
                          <option value="check_pending" className="bg-[#12121A]">Check Pending</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Summary & Actions */}
                  {items.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-t border-white/5 pt-4">
                      <div className="space-y-1">
                        <div className="flex gap-4 text-xs text-white/40">
                          <span>Subtotal: {fmtCurrency(subtotal)}</span>
                          <span>Discount: {fmtCurrency(totalDiscount)}</span>
                        </div>
                        <div className="text-lg font-black text-white">
                          Grand Total: <span className="text-indigo-400">{fmtCurrency(totalAmount)}</span>
                          {totalAmount - poAmountPaid > 0 && (
                            <span className="text-xs text-rose-400 font-semibold block sm:inline sm:ml-3">
                              Due: {fmtCurrency(totalAmount - poAmountPaid)}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={poSubmitting}
                        className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white font-bold text-sm shadow-xl shadow-indigo-600/25 transition-all text-center"
                      >
                        {poSubmitting ? 'Logging Inward Stock...' : 'Submit Purchase & Add Stock'}
                      </button>
                    </div>
                  )}
                </form>
              </div>

              {/* Recent purchases log feed */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white/70 flex items-center gap-2 px-1">
                  <List className="w-4 h-4 text-indigo-400" /> Recent Purchase Bills
                </h3>

                <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-250px)] pr-1">
                  {purchaseOrders.length === 0 ? (
                    <div className="glass-card p-6 text-center text-white/30 text-xs">
                      No purchase orders logged yet.
                    </div>
                  ) : (
                    purchaseOrders.map((po) => {
                      const isExpanded = expandedPoId === po.id;
                      const outstanding = po.total - po.amount_paid;
                      return (
                        <div
                          key={po.id}
                          className="glass-card border border-white/5 p-4 space-y-3 hover:bg-white/[0.01] transition-colors"
                        >
                          <div
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => setExpandedPoId(isExpanded ? null : po.id)}
                          >
                            <div>
                              <p className="font-semibold text-white text-xs truncate max-w-[150px]">
                                {po.supplier_name}
                              </p>
                              <p className="text-[10px] text-white/30 mt-0.5 font-mono uppercase">
                                {po.invoice_no || `ID: ${po.id.slice(-6)}`} · {po.date}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-xs font-bold text-white">{fmtCurrency(po.total)}</p>
                              <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded-full mt-1 uppercase font-semibold ${
                                po.status === 'paid'
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : po.status === 'check_pending'
                                  ? 'bg-amber-500/10 text-amber-400'
                                  : 'bg-rose-500/10 text-rose-400'
                              }`}>
                                {po.status === 'check_pending' ? 'Check' : po.status}
                              </span>
                            </div>
                          </div>

                          {/* Expandable PO items list */}
                          {isExpanded && (
                            <div className="border-t border-white/5 pt-3 mt-2 space-y-2 text-xs">
                              <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Bill Items:</p>
                              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                                {po.items?.map((item: any, idx: number) => (
                                  <div key={idx} className="flex justify-between items-center bg-white/[0.02] p-2 rounded-lg border border-white/5">
                                    <span className="text-white/70 truncate max-w-[150px]">{item.title}</span>
                                    <span className="text-white/40 text-[10px]">
                                      {item.quantity} x {fmtCurrency(item.cost_price)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                              <div className="pt-2 border-t border-white/5 text-[10px] space-y-1">
                                <div className="flex justify-between text-white/40">
                                  <span>Payment Mode:</span>
                                  <span className="capitalize text-white/70">{po.payment_method}</span>
                                </div>
                                <div className="flex justify-between text-white/40">
                                  <span>Amount Paid:</span>
                                  <span className="text-white/70">{fmtCurrency(po.amount_paid)}</span>
                                </div>
                                {outstanding > 0 && (
                                  <div className="flex justify-between text-rose-400">
                                    <span>Outstanding Balance:</span>
                                    <span className="font-bold">{fmtCurrency(outstanding)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            // Suppliers tab
            <motion.div
              key="suppliers"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-4"
            >
              <div className="glass-card overflow-hidden">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-white/[0.03] border-b border-white/5 text-white/40 font-semibold uppercase tracking-wider text-xs">
                      <th className="p-4">Name</th>
                      <th className="p-4">Phone</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Address</th>
                      <th className="p-4">Created Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-white/70">
                    {suppliers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-white/30 text-xs">
                          No suppliers registered. Click "Add Supplier" at top to add one.
                        </td>
                      </tr>
                    ) : (
                      suppliers.map((s) => (
                        <tr key={s.id} className="hover:bg-white/[0.01]">
                          <td className="p-4 font-semibold text-white flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600/10 flex items-center justify-center shrink-0">
                              <Truck className="w-4 h-4 text-indigo-400" />
                            </div>
                            {s.name}
                          </td>
                          <td className="p-4 font-mono text-xs">{s.phone || 'N/A'}</td>
                          <td className="p-4 text-white/60">{s.email || 'N/A'}</td>
                          <td className="p-4 text-white/50 text-xs truncate max-w-xs">{s.address || 'N/A'}</td>
                          <td className="p-4 text-white/40 text-xs">
                            {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Add Supplier Modal */}
      <AnimatePresence>
        {showAddSupplierModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddSupplierModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl bg-[#0F0F16] border border-white/10 p-6 shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-white">Add Supplier / Publisher</h3>
                  <p className="text-xs text-white/40 mt-1">Register supplier details to map inward stock purchase orders.</p>
                </div>
                <button
                  onClick={() => setShowAddSupplierModal(false)}
                  className="p-1 rounded-lg text-white/30 hover:bg-white/5 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddSupplier} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Supplier Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lake House Publications"
                    value={supName}
                    onChange={(e) => setSupName(e.target.value)}
                    className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] px-3.5 py-2.5 text-sm text-white placeholder-white/20 focus:border-indigo-500/50 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Contact Phone</label>
                  <input
                    type="tel"
                    placeholder="e.g. +94 11 234 5678"
                    value={supPhone}
                    onChange={(e) => setSupPhone(e.target.value)}
                    className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] px-3.5 py-2.5 text-sm text-white placeholder-white/20 focus:border-indigo-500/50 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. contact@lakehouse.lk"
                    value={supEmail}
                    onChange={(e) => setSupEmail(e.target.value)}
                    className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] px-3.5 py-2.5 text-sm text-white placeholder-white/20 focus:border-indigo-500/50 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Physical Address</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. D.R. Wijewardene Mawatha, Colombo 10"
                    value={supAddress}
                    onChange={(e) => setSupAddress(e.target.value)}
                    className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] px-3.5 py-2.5 text-sm text-white placeholder-white/20 focus:border-indigo-500/50 outline-none resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setShowAddSupplierModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-white/50 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={supSubmitting || !supName.trim()}
                    className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 rounded-lg shadow-lg shadow-indigo-600/20 transition-all"
                  >
                    {supSubmitting ? 'Adding...' : 'Add Supplier'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
        {showImportModal && (
          <CsvImportModal
            type="suppliers"
            onClose={() => setShowImportModal(false)}
            onSuccess={() => {
              setShowImportModal(false);
              fetchPageData();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
