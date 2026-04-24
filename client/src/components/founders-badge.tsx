import React from 'react';
import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';

interface FoundersBadgeProps {
  tier?: 'bronze' | 'silver' | 'gold' | 'diamond';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const tierConfig = {
  bronze: { 
    bg: 'bg-gradient-to-r from-purple-700 to-purple-600', 
    text: 'text-purple-100',
    label: 'Founder',
    bonus: '25%'
  },
  silver: { 
    bg: 'bg-gradient-to-r from-slate-400 to-slate-300', 
    text: 'text-slate-900',
    label: 'Founder',
    bonus: '50%'
  },
  gold: { 
    bg: 'bg-gradient-to-r from-purple-400 to-teal-300', 
    text: 'text-purple-900',
    label: 'Founder',
    bonus: '75%'
  },
  diamond: { 
    bg: 'bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400', 
    text: 'text-white',
    label: 'Founder',
    bonus: '100%'
  },
};

const sizeConfig = {
  sm: { badge: 'px-2 py-0.5', icon: 'w-3 h-3', text: 'text-xs' },
  md: { badge: 'px-3 py-1', icon: 'w-4 h-4', text: 'text-sm' },
  lg: { badge: 'px-4 py-1.5', icon: 'w-5 h-5', text: 'text-base' },
};

export function FoundersBadge({ tier = 'diamond', size = 'md', showLabel = true }: FoundersBadgeProps) {
  const colors = tierConfig[tier];
  const sizes = sizeConfig[size];

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      className={`inline-flex items-center gap-1.5 rounded-full ${colors.bg} ${colors.text} ${sizes.badge} shadow-lg`}
      data-testid="founders-badge"
    >
      <Crown className={sizes.icon} />
      {showLabel && (
        <span className={`font-semibold ${sizes.text}`}>
          {colors.label}
        </span>
      )}
    </motion.div>
  );
}

export function getFoundersTier(amountCents: number): 'bronze' | 'silver' | 'gold' | 'diamond' | null {
  if (amountCents >= 10000) return 'diamond';
  if (amountCents >= 7500) return 'gold';
  if (amountCents >= 5000) return 'silver';
  if (amountCents >= 2500) return 'bronze';
  return null;
}
