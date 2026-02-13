import React, { useState, useEffect } from 'react';
import { GameStatus, Bet } from '../types';

interface BettingPanelProps {
  status: GameStatus;
  balance: number;
  onPlaceBet: (amount: number) => void;
  onCashOut: () => void;
  activeBet: Bet | null;
  currentMultiplier: number;
}

const BettingPanel: React.FC<BettingPanelProps> = ({ 
  status, 
  balance, 
  onPlaceBet, 
  onCashOut, 
  activeBet, 
  currentMultiplier 
}) => {
  const [betAmount, setBetAmount] = useState(10);
  const [autoCashOutEnabled, setAutoCashOutEnabled] = useState(false);
  const [autoCashOutValue, setAutoCashOutValue] = useState(2.00);
  const [autoBetEnabled, setAutoBetEnabled] = useState(false);

  const presets = [10, 50, 100, 500];

  // Auto Cash Out logic
  useEffect(() => {
    if (
      autoCashOutEnabled && 
      status === GameStatus.FLYING && 
      activeBet && 
      !activeBet.isCashedOut && 
      activeBet.status === 'PENDING'
    ) {
      if (currentMultiplier >= autoCashOutValue) {
        onCashOut();
      }
    }
  }, [currentMultiplier, autoCashOutEnabled, autoCashOutValue, status, activeBet, onCashOut]);

  // Auto Bet logic
  useEffect(() => {
    if (autoBetEnabled && status === GameStatus.WAITING && !activeBet) {
      if (balance >= betAmount && betAmount > 0) {
        onPlaceBet(betAmount);
      } else {
        setAutoBetEnabled(false);
      }
    }
  }, [status, autoBetEnabled, activeBet, balance, betAmount, onPlaceBet]);

  // Validation logic
  const isTooHigh = betAmount > balance;
  const isTooLow = betAmount <= 0 || isNaN(betAmount);
  const isInvalid = isTooHigh || isTooLow;
  
  // A bet is "Pending" if it was placed for the upcoming round
  const hasPendingBet = activeBet !== null && activeBet.status === 'PENDING';
  
  const isButtonDisabled = (status !== GameStatus.WAITING && status !== GameStatus.IDLE) || isInvalid;
  const showCashOut = status === GameStatus.FLYING && activeBet && !activeBet.isCashedOut && activeBet.status === 'PENDING';
  
  const potentialWin = activeBet ? (activeBet.amount * currentMultiplier) : 0;
  const profit = activeBet ? (potentialWin - activeBet.amount) : 0;

  // Determine if we should show the "spinning" disabled state
  const isRoundActive = status === GameStatus.FLYING || status === GameStatus.CRASHED;

  return (
    <div className="p-4 bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-slate-800 flex flex-col gap-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-10 relative transition-all duration-500">
      
      {/* Active Bet Details Section */}
      {activeBet && (
        <div className="w-full bg-slate-950/50 rounded-xl border border-slate-800/80 p-3 mb-1 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Active Bet Details</span>
            <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
              activeBet.status === 'WON' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
              activeBet.status === 'LOST' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
              'bg-sky-500/20 text-sky-400 border border-sky-500/30 animate-pulse'
            }`}>
              {activeBet.status}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-500 uppercase font-bold">Amount</span>
              <span className="text-sm font-orbitron font-bold text-white">${activeBet.amount.toFixed(2)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-500 uppercase font-bold">Multiplier</span>
              <span className="text-sm font-orbitron font-bold text-sky-400">
                {activeBet.status === 'WON' 
                  ? activeBet.multiplierAtCashout?.toFixed(2) 
                  : status === GameStatus.FLYING 
                    ? currentMultiplier.toFixed(2) 
                    : '-'}x
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[9px] text-slate-500 uppercase font-bold">Result</span>
              <span className={`text-sm font-orbitron font-bold ${activeBet.status === 'WON' ? 'text-emerald-400' : 'text-slate-400'}`}>
                {activeBet.status === 'WON' ? `+$${(activeBet.amount * (activeBet.multiplierAtCashout || 0)).toFixed(2)}` : '--'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Controls Wrapper */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Enhanced Real-time Potential Win Indicator (Flying Mode) */}
        {showCashOut && (
          <div className="absolute -top-16 left-0 right-0 flex justify-center pointer-events-none px-4">
            <div className="w-full max-w-lg bg-slate-900/95 border-x border-t border-emerald-500/40 rounded-t-2xl px-6 py-2.5 backdrop-blur-xl flex items-center justify-between shadow-[0_-15px_30px_rgba(16,185,129,0.15)] animate-in slide-in-from-bottom-4 duration-300">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-0.5">Total Return</span>
                <span className="text-2xl font-orbitron font-black text-white tabular-nums drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                  ${potentialWin.toFixed(2)}
                </span>
              </div>
              
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${autoCashOutEnabled ? 'bg-amber-400' : 'bg-emerald-500'} animate-ping`}></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {autoCashOutEnabled ? `Auto at ${autoCashOutValue.toFixed(2)}x` : 'Net Profit'}
                  </span>
                </div>
                <span className="text-lg font-orbitron font-bold text-emerald-400 tabular-nums">
                  +${profit.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Bet Controls */}
        <div className="flex-1 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Bet Amount</label>
            <div className="flex items-center gap-2">
              {isTooHigh && (
                <span className="text-[10px] text-rose-500 font-bold animate-pulse">Insufficient Balance</span>
              )}
              {isTooLow && !hasPendingBet && (
                <span className="text-[10px] text-rose-500 font-bold animate-pulse">Invalid Amount</span>
              )}
              {!isInvalid && (
                <span className="text-[10px] font-mono text-emerald-500/80 bg-emerald-500/5 px-2 py-0.5 rounded-full border border-emerald-500/10">Min: $1.00</span>
              )}
            </div>
          </div>
          
          <div className="relative group">
            <input 
              type="number" 
              value={betAmount}
              onChange={(e) => setBetAmount(parseFloat(e.target.value))}
              className={`w-full bg-slate-950 border-2 rounded-xl px-5 py-4 text-3xl font-orbitron font-black text-white focus:outline-none transition-all shadow-inner ${isInvalid && !hasPendingBet ? 'border-rose-500/50 focus:border-rose-500' : 'border-slate-800 focus:border-sky-500/50'}`}
              disabled={(status === GameStatus.FLYING && !showCashOut) || (status === GameStatus.WAITING && hasPendingBet)}
              min="1"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
              {presets.map(val => (
                <button 
                  key={val}
                  onClick={() => setBetAmount(val)}
                  className="px-3 py-1.5 text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all active:scale-95"
                  disabled={(status === GameStatus.FLYING && !showCashOut) || (status === GameStatus.WAITING && hasPendingBet)}
                >
                  +${val}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
            {/* Auto Bet Settings */}
            <div className={`flex items-center gap-4 bg-slate-950/80 p-3 rounded-xl border transition-all shadow-sm ${autoBetEnabled ? 'border-sky-500/30 bg-sky-500/5' : 'border-slate-800/50'}`}>
              <div className="flex items-center gap-3 w-full">
                <button 
                  onClick={() => setAutoBetEnabled(!autoBetEnabled)}
                  className={`w-12 h-6 rounded-full relative transition-all duration-300 ${autoBetEnabled ? 'bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.5)]' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${autoBetEnabled ? 'left-7' : 'left-1'}`} />
                </button>
                <div className="flex flex-col">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${autoBetEnabled ? 'text-sky-400' : 'text-slate-500'}`}>Auto Bet</span>
                  <span className="text-[8px] text-slate-600 font-bold uppercase">{autoBetEnabled ? 'Active' : 'Stopped'}</span>
                </div>
              </div>
            </div>

            {/* Auto Cash Out Settings */}
            <div className={`flex items-center gap-4 bg-slate-950/80 p-3 rounded-xl border transition-all shadow-sm ${autoCashOutEnabled ? 'border-amber-500/30 bg-amber-500/5' : 'border-slate-800/50'}`}>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setAutoCashOutEnabled(!autoCashOutEnabled)}
                  className={`w-12 h-6 rounded-full relative transition-all duration-300 ${autoCashOutEnabled ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${autoCashOutEnabled ? 'left-7' : 'left-1'}`} />
                </button>
                <div className="flex flex-col">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${autoCashOutEnabled ? 'text-amber-400' : 'text-slate-500'}`}>Auto Cash</span>
                  <div className="flex items-center gap-1">
                    <input 
                      type="number" 
                      step="0.1"
                      min="1.01"
                      value={autoCashOutValue}
                      onChange={(e) => setAutoCashOutValue(Math.max(1.01, Number(e.target.value)))}
                      disabled={!autoCashOutEnabled}
                      className={`w-12 bg-transparent border-b focus:outline-none text-right font-orbitron font-bold text-[10px] transition-colors ${autoCashOutEnabled ? 'text-white border-amber-500/50' : 'text-slate-700 border-slate-800'}`}
                    />
                    <span className={`text-[10px] font-black ${autoCashOutEnabled ? 'text-amber-500' : 'text-slate-700'}`}>x</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col md:w-80 group relative">
          {showCashOut ? (
            <button 
              onClick={onCashOut}
              className="h-full w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-orbitron font-black text-3xl md:text-4xl rounded-2xl transition-all active:scale-95 pulse-emerald flex flex-col items-center justify-center py-6 shadow-[0_10px_30px_rgba(16,185,129,0.4)]"
            >
              <span className="leading-none mb-1 tracking-tighter">
                {autoCashOutEnabled ? 'PRIMED' : 'CASH OUT'}
              </span>
              <div className="flex items-center gap-2 text-xl opacity-90 font-mono">
                 <span>$</span>
                 <span className="tabular-nums">{potentialWin.toFixed(2)}</span>
              </div>
              {autoCashOutEnabled && (
                <span className="text-[10px] mt-1 opacity-70">Target: {autoCashOutValue.toFixed(2)}x</span>
              )}
            </button>
          ) : (
            <button 
              onClick={() => onPlaceBet(betAmount)}
              disabled={isButtonDisabled || hasPendingBet}
              className={`h-full w-full font-orbitron font-black text-2xl md:text-3xl rounded-2xl transition-all duration-300 py-6 md:py-0 relative overflow-hidden flex items-center justify-center
                ${(isButtonDisabled || hasPendingBet) 
                  ? 'bg-slate-800 text-slate-600 cursor-not-allowed border-2 border-slate-700/50 shadow-inner' 
                  : autoBetEnabled
                    ? 'bg-gradient-to-br from-sky-400 to-sky-500 text-white shadow-[0_0_20px_rgba(14,165,233,0.4)] active:scale-[0.98] border-t border-sky-300/30'
                    : 'bg-gradient-to-br from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white shadow-[0_15px_30px_rgba(14,165,233,0.3)] active:scale-[0.98] border-t border-sky-400/30'
                }`}
            >
              {/* Subtle spinning background for active round when button is disabled */}
              {isRoundActive && isButtonDisabled && !hasPendingBet && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                  <svg className="w-24 h-24 animate-spin-slow text-slate-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}

              <div className="relative z-10">
                {hasPendingBet ? (
                  <div className="flex flex-col items-center">
                    <span className="text-sky-300 text-sm font-bold uppercase tracking-widest mb-1">Waiting for Takeoff</span>
                    <span className="opacity-50">{autoBetEnabled ? 'AUTO PENDING' : 'BET PLACED'}</span>
                    {autoCashOutEnabled && (
                      <span className="text-[9px] mt-1 text-amber-400/80">Auto: {autoCashOutValue.toFixed(2)}x</span>
                    )}
                  </div>
                ) : isTooHigh ? 'LOW BALANCE' : autoBetEnabled ? 'AUTO ON' : 'BET'}
              </div>
              
              {!isButtonDisabled && !hasPendingBet && (
                 <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              )}
            </button>
          )}
          
          {activeBet && activeBet.status === 'WON' && (
             <div className="absolute -top-10 left-0 right-0 text-center text-emerald-400 font-black animate-bounce text-lg drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">
               +${(activeBet.amount * (activeBet.multiplierAtCashout || 0)).toFixed(2)} WIN!
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BettingPanel;