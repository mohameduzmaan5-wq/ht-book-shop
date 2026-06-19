'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  User,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Smartphone,
  Banknote,
  Percent,
  DollarSign,
  StickyNote,
  CheckCircle2,
  PackageOpen,
} from 'lucide-react';
import { useCartStore } from '@/store';

interface CartPanelProps {
  onCompleteSale: () => void;
}

export default function CartPanel({ onCompleteSale }: CartPanelProps) {
  const [customerOpen, setCustomerOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);

  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    getSubtotal,
    getDiscountAmount,
    getTaxAmount,
    getTotal,
    customerName,
    setCustomerName,
    customerEmail,
    setCustomerEmail,
    customerPhone,
    setCustomerPhone,
    discountType,
    setDiscountType,
    discountValue,
    setDiscountValue,
    paymentMethod,
    setPaymentMethod,
    notes,
    setNotes,
    taxRate,
    amountPaid,
    setAmountPaid,
  } = useCartStore();

  const subtotal = getSubtotal();
  const discountAmount = getDiscountAmount();
  const taxAmount = getTaxAmount();
  const total = getTotal();

  const handlePaymentMethodChange = (method: 'cash' | 'card' | 'mobile' | 'credit') => {
    setPaymentMethod(method);
    if (method === 'credit') {
      setCustomerOpen(true);
      setAmountPaid(0);
    }
  };

  const isCreditValid = paymentMethod !== 'credit' || (customerName.trim() !== '' && customerPhone.trim() !== '');

  const handleCompleteSale = () => {
    if (items.length === 0) return;
    if (paymentMethod === 'credit' && !isCreditValid) {
      setCustomerOpen(true);
      return;
    }
    onCompleteSale();
  };


  return (
    <div className="flex h-full flex-col bg-surface-50 border-l border-white/[0.06]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600/15">
            <ShoppingCart className="h-4 w-4 text-brand-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Current Sale</h2>
            <p className="text-xs text-white/40">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </p>
          </div>
        </div>
        {items.length > 0 && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={clearCart}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-rose-400 transition-colors hover:bg-rose-500/10"
          >
            Clear All
          </motion.button>
        )}
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <AnimatePresence mode="popLayout">
          {items.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.04] mb-4">
                <PackageOpen className="h-8 w-8 text-white/20" />
              </div>
              <p className="text-sm font-medium text-white/30 mb-1">Cart is empty</p>
              <p className="text-xs text-white/20">Click on products to add them</p>
            </motion.div>
          ) : (
            <div className="space-y-2">
              {items.map((item, index) => (
                <motion.div
                  key={item.book.id}
                  layout
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40, height: 0, marginBottom: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-3"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-white leading-snug line-clamp-1">
                        {item.book.title}
                      </h4>
                      <p className="text-[10px] text-white/40 mt-0.5">
                        Rs. {item.unit_price.toFixed(2)} each
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => removeItem(item.book.id)}
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-white/30 transition-colors hover:bg-rose-500/15 hover:text-rose-400"
                    >
                      <Trash2 className="h-3 w-3" />
                    </motion.button>
                  </div>

                  <div className="flex items-center justify-between">
                    {/* Quantity controls */}
                    <div className="flex items-center gap-1">
                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        onClick={() => updateQuantity(item.book.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.06] text-white/60 transition-colors hover:bg-white/[0.12] disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Minus className="h-3 w-3" />
                      </motion.button>
                      <span className="w-8 text-center text-xs font-bold text-white">
                        {item.quantity}
                      </span>
                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        onClick={() => updateQuantity(item.book.id, item.quantity + 1)}
                        disabled={item.quantity >= item.available_quantity}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.06] text-white/60 transition-colors hover:bg-white/[0.12] disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Plus className="h-3 w-3" />
                      </motion.button>
                      {item.quantity >= item.available_quantity && (
                        <span className="text-[9px] text-amber-400/70 ml-1">Max</span>
                      )}
                    </div>

                    {/* Line total */}
                    <span className="text-sm font-bold text-white">
                      Rs. {(item.unit_price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Section */}
      <div className="border-t border-white/[0.06] bg-surface-100/80 backdrop-blur-sm">
        {/* Customer Info (collapsible) */}
        <div className="border-b border-white/[0.04]">
          <button
            onClick={() => setCustomerOpen(!customerOpen)}
            className="flex w-full items-center justify-between px-5 py-2.5 text-xs font-medium text-white/50 hover:text-white/70 transition-colors"
          >
            <span className="flex items-center gap-2">
              <User className="h-3.5 w-3.5" />
              Customer Info
              {customerName && (
                <span className="text-brand-400 ml-1">• {customerName}</span>
              )}
            </span>
            {customerOpen ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
          <AnimatePresence>
            {customerOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="space-y-2 px-5 pb-3">
                  <input
                    type="text"
                    placeholder="Customer name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full rounded-lg bg-white/[0.04] border border-white/[0.08] px-3 py-2 text-xs text-white placeholder:text-white/25 focus:border-brand-500/50 focus:outline-none focus:ring-1 focus:ring-brand-500/20 transition-all"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full rounded-lg bg-white/[0.04] border border-white/[0.08] px-3 py-2 text-xs text-white placeholder:text-white/25 focus:border-brand-500/50 focus:outline-none focus:ring-1 focus:ring-brand-500/20 transition-all"
                  />
                  <input
                    type="tel"
                    placeholder="Phone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full rounded-lg bg-white/[0.04] border border-white/[0.08] px-3 py-2 text-xs text-white placeholder:text-white/25 focus:border-brand-500/50 focus:outline-none focus:ring-1 focus:ring-brand-500/20 transition-all"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Discount */}
        <div className="flex items-center gap-2 border-b border-white/[0.04] px-5 py-2.5">
          <span className="text-xs text-white/40 shrink-0">Discount:</span>
          <div className="flex rounded-lg bg-white/[0.04] border border-white/[0.06] overflow-hidden">
            <button
              onClick={() => setDiscountType('percentage')}
              className={`flex items-center justify-center h-7 w-8 text-xs transition-colors ${
                discountType === 'percentage'
                  ? 'bg-brand-600 text-white'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              <Percent className="h-3 w-3" />
            </button>
            <button
              onClick={() => setDiscountType('flat')}
              className={`flex items-center justify-center h-7 w-8 text-xs transition-colors ${
                discountType === 'flat'
                  ? 'bg-brand-600 text-white'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              <DollarSign className="h-3 w-3" />
            </button>
          </div>
          <input
            type="number"
            min="0"
            max={discountType === 'percentage' ? 100 : subtotal}
            value={discountValue || ''}
            onChange={(e) => setDiscountValue(Number(e.target.value))}
            placeholder="0"
            className="w-20 rounded-lg bg-white/[0.04] border border-white/[0.06] px-2.5 py-1.5 text-xs text-white text-right placeholder:text-white/25 focus:border-brand-500/50 focus:outline-none focus:ring-1 focus:ring-brand-500/20 transition-all"
          />
        </div>

        {/* Payment Method */}
        <div className="border-b border-white/[0.04] px-5 py-2.5">
          <p className="text-[10px] font-medium uppercase tracking-wider text-white/30 mb-2">
            Payment Method
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            {([
              { value: 'cash' as const, icon: Banknote, label: 'Cash' },
              { value: 'card' as const, icon: CreditCard, label: 'Card' },
              { value: 'mobile' as const, icon: Smartphone, label: 'Mobile' },
              { value: 'credit' as const, icon: User, label: 'Credit' },
            ]).map((method) => (
              <motion.button
                key={method.value}
                whileTap={{ scale: 0.95 }}
                onClick={() => handlePaymentMethodChange(method.value)}
                className={`flex flex-col items-center gap-1 rounded-xl py-2.5 text-xs font-medium transition-all duration-200 ${
                  paymentMethod === method.value
                    ? 'bg-brand-600/20 border border-brand-500/40 text-brand-300 shadow-lg shadow-brand-600/10'
                    : 'bg-white/[0.03] border border-white/[0.06] text-white/40 hover:bg-white/[0.06] hover:text-white/60'
                }`}
              >
                <method.icon className="h-4 w-4" />
                <span className="text-[10px]">{method.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Down Payment & Credit Ledger Info */}
        {paymentMethod === 'credit' && (
          <div className="border-b border-white/[0.04] px-5 py-3 bg-white/[0.02] space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-white/50">Down Payment (Upfront):</span>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-white/40">Rs.</span>
                <input
                  type="number"
                  min="0"
                  max={total}
                  value={amountPaid || ''}
                  onChange={(e) => {
                    const val = Math.min(Number(e.target.value), total);
                    setAmountPaid(val);
                  }}
                  placeholder="0.00"
                  className="w-28 rounded-lg bg-white/[0.04] border border-white/[0.08] pl-7 pr-2.5 py-1 text-xs text-white text-right placeholder:text-white/25 focus:border-brand-500/50 focus:outline-none focus:ring-1 focus:ring-brand-500/20 transition-all font-semibold"
                />
              </div>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-white/[0.04]">
              <span className="text-rose-400/80">Outstanding Balance (Due):</span>
              <span className="text-rose-400 font-bold">Rs. {Math.max(0, total - amountPaid).toFixed(2)}</span>
            </div>
            {(!customerName.trim() || !customerPhone.trim()) && (
              <p className="text-[9px] text-amber-400/80 italic mt-1 leading-tight">
                * Customer Name and Phone are required for Credit checkout.
              </p>
            )}
          </div>
        )}


        {/* Notes (collapsible) */}
        <div className="border-b border-white/[0.04]">
          <button
            onClick={() => setNotesOpen(!notesOpen)}
            className="flex w-full items-center justify-between px-5 py-2 text-xs font-medium text-white/40 hover:text-white/60 transition-colors"
          >
            <span className="flex items-center gap-2">
              <StickyNote className="h-3.5 w-3.5" />
              Notes
              {notes && <span className="text-brand-400">•</span>}
            </span>
            {notesOpen ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
          <AnimatePresence>
            {notesOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-3">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add sale notes..."
                    rows={2}
                    className="w-full rounded-lg bg-white/[0.04] border border-white/[0.08] px-3 py-2 text-xs text-white placeholder:text-white/25 focus:border-brand-500/50 focus:outline-none focus:ring-1 focus:ring-brand-500/20 transition-all resize-none"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Summary */}
        <div className="space-y-1.5 px-5 py-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/40">Subtotal</span>
            <span className="text-white/70 font-medium">Rs. {subtotal.toFixed(2)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-emerald-400/70">
                Discount
                {discountType === 'percentage' ? ` (${discountValue}%)` : ''}
              </span>
              <span className="text-emerald-400 font-medium">
                -Rs. {discountAmount.toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/40">Tax ({taxRate}%)</span>
            <span className="text-white/70 font-medium">Rs. {taxAmount.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-white/[0.08] pt-2 mt-2">
            <span className="text-sm font-bold text-white">Total</span>
            <span className="text-xl font-black text-white tabular-nums">
              Rs. {total.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 px-5 pb-5 pt-1">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCompleteSale}
            disabled={items.length === 0}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-3.5 text-sm font-bold text-white shadow-xl shadow-brand-600/25 transition-all hover:shadow-brand-500/40 disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none"
          >
            <CheckCircle2 className="h-4 w-4" />
            Complete Sale — Rs. {total.toFixed(2)}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={clearCart}
            disabled={items.length === 0}
            className="flex w-full items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.08] px-4 py-2.5 text-xs font-medium text-white/50 transition-all hover:bg-white/[0.08] hover:text-white/70 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Clear Cart
          </motion.button>
        </div>
      </div>
    </div>
  );
}
