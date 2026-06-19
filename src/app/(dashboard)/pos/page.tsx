'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, BookOpen, AlertTriangle, CheckCircle, Receipt, X, Plus } from 'lucide-react';
import { apiClient as db } from '@/lib/apiClient';
import { useCartStore, useAppStore, useAuthStore, useNotificationStore, useToastStore } from '@/store';
import ProductCard from '@/components/pos/ProductCard';
import CartPanel from '@/components/pos/CartPanel';
import useBarcodeScanner from '@/hooks/useBarcodeScanner';
import generateReceiptHtml from '@/lib/utils/receiptGenerator';
import type { Book } from '@/types';

const categories = [
  'All',
  'Fiction',
  'Biography',
  'Self-Help',
  'Business',
  'Science',
  'Technology',
  'Philosophy',
  'History',
  'Children',
  'Poetry',
  'Art',
];

export default function POSPage() {
  const { user } = useAuthStore();
  const { selectedBranch } = useAppStore();
  const { addToast } = useToastStore();
  
  const {
    items,
    addItem,
    clearCart,
    getSubtotal,
    getDiscountAmount,
    getTaxAmount,
    getTotal,
    customerName,
    customerEmail,
    customerPhone,
    discountType,
    discountValue,
    paymentMethod,
    notes,
    amountPaid,
  } = useCartStore();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [inventoryList, setInventoryList] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastSaleId, setLastSaleId] = useState('');
  const [lastSaleTotal, setLastSaleTotal] = useState(0);
  const [receiptItems, setReceiptItems] = useState<typeof items>([]);
  const [receiptCustomer, setReceiptCustomer] = useState({ name: '', email: '', phone: '' });
  const [receiptPayment, setReceiptPayment] = useState<'cash'|'card'|'mobile'|'credit'>('cash');

  const [receiptSummary, setReceiptSummary] = useState({ subtotal: 0, discount: 0, tax: 0, total: 0 });
  const [simulatedBarcode, setSimulatedBarcode] = useState('');

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Active Branch determination: fallback to branch_001 if not set
  const activeBranchId = useMemo(() => {
    if (user?.role === 'super_admin') {
      return selectedBranch || 'branch_001';
    }
    return user?.branch_id || 'branch_001';
  }, [user, selectedBranch]);

  // Load branches
  useEffect(() => {
    db.getBranches().then(setBranches).catch(console.error);
  }, []);

  // Fetch branch details for display
  const activeBranch = useMemo(() => {
    return branches.find((b) => b.id === activeBranchId);
  }, [branches, activeBranchId]);

  // Load inventory on mount or when active branch, search, or category changes
  const loadInventory = async () => {
    try {
      const data = await db.getInventory(
        activeBranchId,
        search || undefined,
        selectedCategory === 'All' ? undefined : selectedCategory
      );
      setInventoryList(data);
    } catch (err) {
      console.error('Failed to load POS inventory:', err);
    }
  };

  useEffect(() => {
    loadInventory();
  }, [activeBranchId, search, selectedCategory]);

  // Real-time synchronization
  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail.type === 'inventory') {
        loadInventory();
      }
    };
    window.addEventListener('db-update', handleUpdate);
    return () => window.removeEventListener('db-update', handleUpdate);
  }, [activeBranchId, search, selectedCategory]);

  // Keyboard Shortcuts: F2 to focus search, Escape to clear
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape') {
        setSearch('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Barcode scanner logic
  const handleBarcodeScan = (barcode: string) => {
    if (!barcode) return;
    const cleanBarcode = barcode.trim().replace(/-/g, '');
    
    // Find item with matching barcode
    const matchedItem = inventoryList.find(
      (item) => item.book?.barcode?.replace(/-/g, '') === cleanBarcode
    );

    if (matchedItem) {
      if (matchedItem.quantity > 0) {
        addItem(matchedItem.book, activeBranchId, matchedItem.quantity);
        addToast({
          type: 'success',
          title: 'Barcode Scanned',
          message: `Added "${matchedItem.book.title}" to cart.`,
        });
      } else {
        addToast({
          type: 'warning',
          title: 'Out of Stock',
          message: `"${matchedItem.book.title}" is out of stock.`,
        });
      }
    } else {
      addToast({
        type: 'error',
        title: 'Book Not Found',
        message: `No book found matching barcode "${barcode}".`,
      });
    }
  };

  // Bind hardware barcode scanner hook
  useBarcodeScanner({ onScan: handleBarcodeScan });

  const handleAddProduct = (book: Book, availableQty: number) => {
    addItem(book, activeBranchId, availableQty);
  };

  const handleCompleteSale = async () => {
    if (items.length === 0) return;

    // Check if cashier user is logged in
    const cashierId = user?.id || 'user_001';

    // Prepare sale items for DB
    const saleItemsData = items.map((item) => ({
      bookId: item.book.id,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      discount: item.discount,
    }));

    const total = getTotal();
    const amountPaidVal = paymentMethod === 'credit' ? amountPaid : total;
    const amountDueVal = paymentMethod === 'credit' ? Math.max(0, total - amountPaid) : 0;

    try {
      // Register sale in database
      const createdSale = await db.createSale({
        branchId: activeBranchId,
        cashierId,
        customerName,
        customerEmail,
        customerPhone,
        subtotal: getSubtotal(),
        discountAmount: getDiscountAmount(),
        discountType,
        taxAmount: getTaxAmount(),
        total,
        paymentMethod,
        notes,
        amountPaid: amountPaidVal,
        amountDue: amountDueVal,
        items: saleItemsData,
      });


      // Capture receipt details for the success modal
      setLastSaleId(createdSale.id);
      setLastSaleTotal(createdSale.total);

      // Snapshot the cart before clearing (for receipt printing)
      setReceiptItems([...items]);
      setReceiptCustomer({ name: customerName, email: customerEmail, phone: customerPhone });
      setReceiptPayment(paymentMethod);
      setReceiptSummary({ subtotal: getSubtotal(), discount: getDiscountAmount(), tax: getTaxAmount(), total: getTotal() });

      // Reset checkout forms & cart
      clearCart();

      // Display modal
      setShowSuccessModal(true);
      
      // Refresh products list in state (decrements inventory totals)
      loadInventory();
      
      addToast({
        type: 'success',
        title: 'Sale Completed',
        message: `Invoice #${createdSale.id.slice(-8).toUpperCase()} completed.`,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Transaction Failed',
        message: err.message || 'Could not complete POS sale.',
      });
    }
  };

  // Print receipt using custom receiptGenerator template
  const handlePrintReceipt = async () => {
    try {
      const settings = await db.getSettings();
      const branchName = activeBranch?.name || activeBranchId;
      const receiptHtml = generateReceiptHtml({
        saleId: lastSaleId,
        customer: receiptCustomer,
        paymentMethod: receiptPayment,
        summary: receiptSummary,
        items: receiptItems,
        branchName,
        settings,
      });

      const w = window.open('', '_blank', 'width=420,height=650');
      if (w) {
        w.document.write(receiptHtml);
        w.document.close();
        w.focus();
        // Trigger print dialog
        setTimeout(() => {
          w.print();
        }, 300);
      }
    } catch (err) {
      console.error('Failed to print receipt:', err);
      addToast({
        type: 'error',
        title: 'Print Error',
        message: 'Could not load receipt settings template.',
      });
    }
  };

  return (
    <div className="flex h-[calc(100vh-100px)] w-full gap-6 overflow-hidden">
      {/* Product Grid Area (60%) */}
      <div className="flex flex-1 flex-col h-full overflow-hidden">
        {/* Search and Shortcuts */}
        <div className="mb-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search ISBN, barcode, title... (F2 to focus)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] py-2.5 pl-11 pr-4 text-sm text-white placeholder-white/20 outline-none transition-all focus:border-brand-500/50 focus:bg-white/[0.07]"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute top-1/2 right-4 -translate-y-1/2 text-white/30 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          {/* Simulated Barcode scanner toolbar */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Simulate barcode scan..."
              value={simulatedBarcode}
              onChange={(e) => setSimulatedBarcode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleBarcodeScan(simulatedBarcode);
                  setSimulatedBarcode('');
                }
              }}
              className="rounded-xl bg-white/[0.04] border border-white/[0.08] px-3.5 py-2.5 text-xs text-white placeholder-white/20 outline-none focus:border-indigo-500/50"
            />
            <button
              onClick={() => {
                handleBarcodeScan(simulatedBarcode);
                setSimulatedBarcode('');
              }}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-all shadow-md shadow-indigo-600/10"
            >
              <Plus className="w-3.5 h-3.5" /> Scan
            </button>
          </div>

          <div className="hidden shrink-0 rounded-lg bg-white/[0.03] px-3 py-1.5 border border-white/[0.05] text-[10px] font-semibold text-white/30 sm:block">
            ACTIVE BRANCH: <span className="text-brand-400">{activeBranch?.name || activeBranchId}</span>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`
                shrink-0 rounded-xl px-4 py-2 text-xs font-semibold border transition-all duration-200
                ${selectedCategory === cat
                  ? 'bg-brand-600 text-white border-brand-500 shadow-lg shadow-brand-600/25'
                  : 'bg-white/[0.04] text-white/55 border-white/[0.08] hover:bg-white/[0.08] hover:text-white'
                }
              `}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto pr-1">
          {inventoryList.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-2xl bg-white/[0.01] border border-white/[0.03] text-center">
              <BookOpen className="h-10 w-10 text-white/10 mb-2" />
              <p className="text-sm font-medium text-white/40">No books found in inventory</p>
              <p className="text-xs text-white/20 mt-1">Try selecting another category or check spelling</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {inventoryList.map((item) => (
                <ProductCard
                  key={item.id}
                  book={item.book}
                  quantity={item.quantity}
                  onAdd={() => handleAddProduct(item.book, item.quantity)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Checkout Sidebar (40%) */}
      <div className="w-[380px] shrink-0 h-full overflow-hidden">
        <CartPanel onCompleteSale={handleCompleteSale} />
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSuccessModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl bg-[#0F0F16] border border-white/10 p-6 shadow-2xl"
            >
              {/* Success Badge */}
              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 mb-4 border border-emerald-500/20">
                  <CheckCircle className="h-9 w-9 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Sale Completed Successfully</h3>
                <p className="text-xs text-white/40 mt-1">
                  Transaction has been logged and inventory restocked.
                </p>
              </div>

              {/* Invoice Detail Box */}
              <div className="mt-6 rounded-xl bg-white/[0.02] border border-white/[0.04] p-4 text-sm font-medium">
                <div className="flex justify-between py-1 border-b border-white/[0.04]">
                  <span className="text-white/40">Invoice #</span>
                  <span className="text-white uppercase font-semibold">{lastSaleId.slice(-8)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/[0.04] mt-2">
                  <span className="text-white/40">Branch</span>
                  <span className="text-white">{activeBranch?.name || activeBranchId}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/[0.04] mt-2">
                  <span className="text-white/40">Payment Mode</span>
                  <span className="text-white capitalize">{paymentMethod}</span>
                </div>
                <div className="flex justify-between py-1 mt-2 pt-1 font-semibold text-white">
                  <span className="text-white/40 font-normal">Amount Charged</span>
                  <span className="text-lg font-bold text-emerald-400">
                    Rs. {lastSaleTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-col gap-2">
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full rounded-xl bg-brand-600 py-3 text-sm font-bold text-white shadow-lg shadow-brand-600/25 transition-colors hover:bg-brand-500"
                >
                  Close & New Sale
                </button>
                <button
                  onClick={handlePrintReceipt}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white/5 py-3 text-sm font-medium text-white/70 border border-white/15 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <Receipt className="h-4 w-4" />
                  Print Receipt
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
