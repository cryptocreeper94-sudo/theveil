import React from 'react';
import type { FC } from 'react';

export const PriceChart: FC = () => {
  const data: any[] = [];

  return (
    <div className="w-full h-64 rounded-xl bg-slate-950/30 border border-slate-800/40 p-2" data-testid="price-chart">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold text-white">Price Chart</div>
        <div className="flex gap-2 text-xs text-slate-400">
          <button className="p-1 rounded hover:bg-slate-800/30">1H</button>
          <button className="p-1 rounded hover:bg-slate-800/30">24H</button>
          <button className="p-1 rounded hover:bg-slate-800/30">7D</button>
          <button className="p-1 rounded hover:bg-slate-800/30">30D</button>
        </div>
      </div>
      <div className="w-full h-48">
        <div className="w-full h-full flex items-center justify-center text-slate-500">Chart placeholder</div>
      </div>
    </div>
  );
};
