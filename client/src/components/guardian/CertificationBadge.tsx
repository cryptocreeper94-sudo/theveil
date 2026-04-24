import React from 'react';
import { motion } from 'framer-motion';

export const CertificationBadge: React.FC<{ tier: 'Free' | 'Lite' | 'Premier'; verified?: boolean }> = ({ tier, verified = true }) => {
  const color = tier === 'Premier' ? 'bg-pink-500' : tier === 'Lite' ? 'bg-cyan-400' : 'bg-slate-600';
  return (
    <motion.div initial={{ scale: 0.98 }} whileHover={{ scale: 1.02 }} className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${color} text-black`} data-testid="cert-badge">
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none"><path d="M12 2l3 6 6 .5-4.5 4 1 6L12 16l-5.5 3.5 1-6L3 8.5 9 8 12 2z" fill="currentColor" /></svg>
      <span className="text-xs font-semibold">{tier}</span>
      {verified ? <span className="text-xs ml-1">Verified</span> : null}
    </motion.div>
  );
};
