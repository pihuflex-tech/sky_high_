
import React, { useState, useEffect } from 'react';
import { GameStatus } from '../types';

interface LivePlayersProps {
  status: GameStatus;
  multiplier: number;
}

const names = ["AlexG", "CryptoWhale", "ShadowFox", "LuckyD", "Satoshi_N", "HyperPlane", "BetMaster", "Zen", "SkyWalker", "Turbo"];

const LivePlayers: React.FC<LivePlayersProps> = ({ status, multiplier }) => {
  const [players, setPlayers] = useState<any[]>([]);

  // Simulation: Add/Update players each round
  useEffect(() => {
    if (status === GameStatus.WAITING) {
      // Create new set of mock players
      const newPlayers = names.slice(0, 5 + Math.floor(Math.random() * 5)).map(name => ({
        id: Math.random().toString(),
        name,
        bet: Math.floor(Math.random() * 500) + 10,
        cashout: null,
        target: 1.1 + Math.random() * 10
      }));
      setPlayers(newPlayers);
    }
  }, [status]);

  // Handle mock cashouts during flying
  useEffect(() => {
    if (status === GameStatus.FLYING) {
      setPlayers(prev => prev.map(p => {
        if (!p.cashout && multiplier >= p.target) {
          return { ...p, cashout: multiplier };
        }
        return p;
      }));
    }
  }, [status, multiplier]);

  return (
    <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-xl">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-orbitron font-bold text-sm tracking-widest text-slate-400">LIVE BETS</h3>
          <div className="flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[9px] font-bold text-emerald-500">{players.length + 128}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <table className="w-full text-[11px]">
          <thead className="bg-slate-950/50 sticky top-0 text-slate-500 uppercase font-bold text-[9px] border-b border-slate-800">
            <tr>
              <th className="px-4 py-2 text-left">User</th>
              <th className="px-4 py-2 text-center">Bet</th>
              <th className="px-4 py-2 text-right">Cashout</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/30">
            {players.map(p => (
              <tr key={p.id} className="hover:bg-slate-800/20 transition-colors">
                <td className="px-4 py-2.5 font-medium text-slate-300">{p.name}</td>
                <td className="px-4 py-2.5 text-center font-mono text-slate-400">${p.bet}</td>
                <td className="px-4 py-2.5 text-right font-orbitron font-bold">
                  {p.cashout ? (
                    <span className="text-emerald-400">{p.cashout.toFixed(2)}x</span>
                  ) : status === GameStatus.CRASHED ? (
                    <span className="text-rose-500/50">-</span>
                  ) : (
                    <span className="text-slate-700">...</span>
                  )}
                </td>
              </tr>
            ))}
            {/* Filler rows */}
            {[...Array(5)].map((_, i) => (
               <tr key={i} className="opacity-20 pointer-events-none">
                 <td className="px-4 py-2.5">User_{Math.floor(Math.random() * 1000)}</td>
                 <td className="px-4 py-2.5 text-center">$25</td>
                 <td className="px-4 py-2.5 text-right">...</td>
               </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LivePlayers;
