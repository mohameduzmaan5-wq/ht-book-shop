'use client';

import { motion } from 'framer-motion';
import { type LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type AccentColor = 'indigo' | 'emerald' | 'amber' | 'rose';

interface StatCardProps {
  title: string;
  value: number;
  change?: number;
  icon: LucideIcon;
  color: AccentColor;
  prefix?: string;
  suffix?: string;
  index?: number;
}

const colorMap: Record<AccentColor, {
  iconBg: string;
  iconText: string;
  glow: string;
  border: string;
  badgeBgPositive: string;
  badgeBgNegative: string;
  accentBar: string;
}> = {
  indigo: {
    iconBg: 'bg-indigo-500/10',
    iconText: 'text-indigo-400',
    glow: 'stat-glow-indigo',
    border: 'border-indigo-500/20',
    badgeBgPositive: 'bg-emerald-500/10 text-emerald-400',
    badgeBgNegative: 'bg-rose-500/10 text-rose-400',
    accentBar: 'bg-gradient-to-b from-indigo-500 to-indigo-600',
  },
  emerald: {
    iconBg: 'bg-emerald-500/10',
    iconText: 'text-emerald-400',
    glow: 'stat-glow-emerald',
    border: 'border-emerald-500/20',
    badgeBgPositive: 'bg-emerald-500/10 text-emerald-400',
    badgeBgNegative: 'bg-rose-500/10 text-rose-400',
    accentBar: 'bg-gradient-to-b from-emerald-500 to-emerald-600',
  },
  amber: {
    iconBg: 'bg-amber-500/10',
    iconText: 'text-amber-400',
    glow: 'stat-glow-amber',
    border: 'border-amber-500/20',
    badgeBgPositive: 'bg-emerald-500/10 text-emerald-400',
    badgeBgNegative: 'bg-rose-500/10 text-rose-400',
    accentBar: 'bg-gradient-to-b from-amber-500 to-amber-600',
  },
  rose: {
    iconBg: 'bg-rose-500/10',
    iconText: 'text-rose-400',
    glow: 'stat-glow-rose',
    border: 'border-rose-500/20',
    badgeBgPositive: 'bg-emerald-500/10 text-emerald-400',
    badgeBgNegative: 'bg-rose-500/10 text-rose-400',
    accentBar: 'bg-gradient-to-b from-rose-500 to-rose-600',
  },
};

function AnimatedNumber({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const prevValueRef = useRef(0);

  useEffect(() => {
    const from = prevValueRef.current;
    const to = value;
    const duration = 1200;

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + (to - from) * eased;
      setDisplayValue(current);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        prevValueRef.current = to;
      }
    };

    startTimeRef.current = null;
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [value]);

  const formatted = prefix
    ? `${prefix}${displayValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    : `${displayValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}${suffix}`;

  return <span>{formatted}</span>;
}

export default function StatCard({ title, value, change, icon: Icon, color, prefix, suffix, index = 0 }: StatCardProps) {
  const colors = colorMap[color];
  const isPositive = (change ?? 0) >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`
        relative overflow-hidden rounded-2xl
        bg-white/[0.03] backdrop-blur-xl
        border border-white/[0.06]
        ${colors.glow}
        p-6 group cursor-default
      `}
    >
      {/* Accent bar on left */}
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${colors.accentBar} rounded-l-2xl`} />

      {/* Subtle shimmer overlay on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent" />

      <div className="relative flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white/50 tracking-wide uppercase">
            {title}
          </p>
          <p className="mt-3 text-3xl font-bold text-white tracking-tight">
            <AnimatedNumber value={value} prefix={prefix} suffix={suffix} />
          </p>

          {change !== undefined && (
            <div className="mt-3 flex items-center gap-1.5">
              <span className={`
                inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold
                ${isPositive ? colors.badgeBgPositive : colors.badgeBgNegative}
              `}>
                {isPositive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {isPositive ? '+' : ''}{change.toFixed(1)}%
              </span>
              <span className="text-xs text-white/30">vs last month</span>
            </div>
          )}
        </div>

        <div className={`
          flex-shrink-0 ml-4 p-3 rounded-xl
          ${colors.iconBg}
          transition-transform duration-300 group-hover:scale-110
        `}>
          <Icon className={`w-6 h-6 ${colors.iconText}`} />
        </div>
      </div>

      {/* Bottom sparkline decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
    </motion.div>
  );
}
