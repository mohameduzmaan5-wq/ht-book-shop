'use client';

import { motion } from 'framer-motion';
import { Plus, BookOpen, AlertTriangle } from 'lucide-react';
import type { Book } from '@/types';

interface ProductCardProps {
  book: Book;
  quantity: number;
  onAdd: () => void;
}

export default function ProductCard({ book, quantity, onAdd }: ProductCardProps) {
  const isOutOfStock = quantity <= 0;
  const isLowStock = quantity > 0 && quantity <= 5;

  return (
    <motion.button
      whileHover={isOutOfStock ? {} : { scale: 1.02, y: -2 }}
      whileTap={isOutOfStock ? {} : { scale: 0.98 }}
      onClick={isOutOfStock ? undefined : onAdd}
      disabled={isOutOfStock}
      className={`
        relative w-full text-left rounded-xl border p-4 transition-all duration-200
        ${isOutOfStock
          ? 'bg-white/[0.02] border-white/[0.04] opacity-50 cursor-not-allowed'
          : 'bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.08] hover:border-brand-500/30 hover:shadow-lg hover:shadow-brand-500/5 cursor-pointer'
        }
      `}
    >
      {/* Stock Badge */}
      <div className="absolute top-3 right-3">
        {isOutOfStock ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold text-rose-400 uppercase tracking-wider">
            <AlertTriangle className="h-3 w-3" />
            Out of Stock
          </span>
        ) : isLowStock ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
            {quantity} left
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
            {quantity} in stock
          </span>
        )}
      </div>

      {/* Book Icon Placeholder */}
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10 mb-3">
        <BookOpen className="h-5 w-5 text-brand-400" />
      </div>

      {/* Title & Author */}
      <h3 className="text-sm font-semibold text-white leading-snug line-clamp-2 pr-16 mb-1">
        {book.title}
      </h3>
      <p className="text-xs text-white/40 line-clamp-1 mb-3">
        {book.author}
      </p>

      {/* Price & Add */}
      <div className="flex items-center justify-between">
        <span className="text-base font-bold text-white">
          Rs. {book.selling_price.toFixed(2)}
        </span>

        {!isOutOfStock && (
          <motion.div
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white shadow-lg shadow-brand-600/25 transition-colors hover:bg-brand-500"
          >
            <Plus className="h-4 w-4" />
          </motion.div>
        )}
      </div>

      {/* Category */}
      <div className="mt-2">
        <span className="inline-block rounded-md bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-white/40">
          {book.category}
        </span>
      </div>
    </motion.button>
  );
}
