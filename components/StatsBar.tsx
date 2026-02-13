
import React from 'react';
import { HistoryItem } from '../types';

interface StatsBarProps {
  history: HistoryItem[];
}

const StatsBar: React.FC<StatsBarProps> = ({ history }) => {
  return (
    <div className="flex items-center gap-2 p-2 bg-slate-900/50 rounded-xl border border-slate-800/50 overflow-x-auto no-scrollbar whitespace-nowrap">
      <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-800 rounded-lg shrink-0">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Live History</span>
      </div>
      
      {history.length === 0 ? (
        <span className="text-[10px] text-slate-600 font-semibold px-2">Waiting for first flight...</span>
      ) : (
        history.map((item) => (
          <div 
            key={item.id} 
            className={`px-3 py-1 rounded-full text-[11px] font-orbitron font-bold border transition-all hover:scale-105 cursor-default
              ${item.multiplier >= 10 
                ? 'bg-rose-500/10 border-rose-500 text-rose-500' 
                : item.multiplier >= 2 
                  ? 'bg-sky-500/10 border-sky-500 text-sky-500' 
                  : 'bg-emerald-500/10 border-emerald-500 text-emerald-500'}
            `}
          >
            {item.multiplier.toFixed(2)}x
          </div>
        ))
      )}
    </div>
  );
};

export default StatsBar;
