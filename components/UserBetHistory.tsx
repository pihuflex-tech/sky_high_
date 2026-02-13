
import React from 'react';
import { Bet } from '../types';

interface UserBetHistoryProps {
  userBets: Bet[];
}

const UserBetHistory: React.FC<UserBetHistoryProps> = ({ userBets }) => {
  return (
    <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-xl">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <h3 className="font-orbitron font-bold text-sm tracking-widest text-slate-400">MY BETS</h3>
        <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-500">HISTORY</span>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {userBets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-600 text-sm p-4 text-center">
            <svg className="w-8 h-8 mb-2 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <span>Your betting history will appear here</span>
          </div>
        ) : (
          <table className="w-full text-[11px]">
            <thead className="bg-slate-950/50 sticky top-0 text-slate-500 uppercase font-bold text-[9px] border-b border-slate-800">
              <tr>
                <th className="px-4 py-2 text-left">Time</th>
                <th className="px-4 py-2 text-center">Bet</th>
                <th className="px-4 py-2 text-center">Mult.</th>
                <th className="px-4 py-2 text-right">Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30">
              {userBets.map((bet) => {
                const profit = bet.status === 'WON' 
                  ? (bet.amount * (bet.multiplierAtCashout || 0)) - bet.amount 
                  : -bet.amount;
                
                return (
                  <tr key={bet.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-4 py-2.5 text-slate-500 font-mono">
                      {new Date(bet.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-2.5 text-center font-bold text-slate-300">
                      ${bet.amount.toFixed(0)}
                    </td>
                    <td className="px-4 py-2.5 text-center font-orbitron font-bold">
                      {bet.status === 'WON' ? (
                        <span className="text-emerald-400">{bet.multiplierAtCashout?.toFixed(2)}x</span>
                      ) : (
                        <span className="text-rose-500/50">-</span>
                      )}
                    </td>
                    <td className={`px-4 py-2.5 text-right font-bold ${profit >= 0 ? 'text-emerald-400' : 'text-rose-500/70'}`}>
                      {profit >= 0 ? `+$${profit.toFixed(2)}` : `-$${Math.abs(profit).toFixed(2)}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default UserBetHistory;
