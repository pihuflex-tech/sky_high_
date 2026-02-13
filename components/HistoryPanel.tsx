
import React from 'react';
import { HistoryItem } from '../types';

interface HistoryPanelProps {
  history: HistoryItem[];
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ history }) => {
  return (
    <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-xl">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <h3 className="font-orbitron font-bold text-sm tracking-widest text-slate-400">ROUND HISTORY</h3>
        <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-500">LAST 30</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-2 no-scrollbar">
        {history.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-600 text-sm">
            <svg className="w-8 h-8 mb-2 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>No rounds played yet</span>
          </div>
        )}
        
        {history.map((item) => (
          <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/50 hover:bg-slate-800/30 transition-colors group">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-500">{item.time}</span>
              <span className="text-xs font-mono text-slate-400">#Round_{item.id.slice(-4)}</span>
            </div>
            <div className={`text-lg font-orbitron font-black ${
              item.multiplier >= 10 ? 'text-rose-500' : 
              item.multiplier >= 2 ? 'text-sky-500' : 'text-emerald-400'
            }`}>
              {item.multiplier.toFixed(2)}x
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-slate-950/50 border-t border-slate-800">
        <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-2 uppercase">
          <span>Stats (Global)</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
             <div className="text-[9px] text-slate-500 uppercase">Avg Multiplier</div>
             <div className="text-sm font-orbitron font-bold text-white">2.45x</div>
          </div>
          <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
             <div className="text-[9px] text-slate-500 uppercase">Biggest Win</div>
             <div className="text-sm font-orbitron font-bold text-emerald-400">145.2x</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryPanel;
