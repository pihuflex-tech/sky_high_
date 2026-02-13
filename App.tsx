
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameStatus, Bet, HistoryItem } from './types';
import GameCanvas from './components/GameCanvas';
import BettingPanel from './components/BettingPanel';
import StatsBar from './components/StatsBar';
import HistoryPanel from './components/HistoryPanel';
import UserBetHistory from './components/UserBetHistory';

const App: React.FC = () => {
  const [balance, setBalance] = useState(1000.00);
  const [displayBalance, setDisplayBalance] = useState(1000.00);
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [currentMultiplier, setCurrentMultiplier] = useState(1.00);
  const [countdown, setCountdown] = useState(0);
  const [activeBet, setActiveBet] = useState<Bet | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [userBets, setUserBets] = useState<Bet[]>([]);
  const [lastCrashMultiplier, setLastCrashMultiplier] = useState<number | null>(null);
  const [balanceAnimating, setBalanceAnimating] = useState(false);
  
  const crashPointRef = useRef(1.00);
  const multiplierRef = useRef(1.00);
  const animationFrameRef = useRef<number>(undefined);

  // Smooth balance count-up
  useEffect(() => {
    if (Math.abs(displayBalance - balance) < 0.01) return;
    setBalanceAnimating(true);
    const duration = 500;
    const startValue = displayBalance;
    const endValue = balance;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      
      const nextValue = startValue + (endValue - startValue) * easeProgress;
      setDisplayBalance(nextValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setBalanceAnimating(false);
      }
    };
    requestAnimationFrame(animate);
  }, [balance]);

  // Initialize first game cycle
  useEffect(() => {
    prepareNextRound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const prepareNextRound = () => {
    setStatus(GameStatus.WAITING);
    setCountdown(5);
    setCurrentMultiplier(1.00);
    multiplierRef.current = 1.00;
    // Reset active bet state for the new round
    setActiveBet(null);
  };

  useEffect(() => {
    let timer: any;
    if (status === GameStatus.WAITING && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (status === GameStatus.WAITING && countdown === 0) {
      startFlying();
    }
    return () => clearInterval(timer);
  }, [status, countdown]);

  const startFlying = () => {
    const random = Math.random();
    let crash;
    
    /**
     * Requirement: 
     * 1. 8 out of 10 (80%) go up to 2x or more.
     * 2. 15 out of 10 (interpreted as 1.5 out of 10, or 15%) go to 3x or more.
     */
    if (random < 0.15) {
      // 15% probability: High flight potential (>= 3.0x)
      // Using a Pareto-style distribution for high potential
      crash = 3.0 + (1 / (1 - Math.random() * 0.98)) * 1.5;
    } else if (random < 0.80) {
      // 65% probability (making a total of 80%): Medium flight (2.0x to 3.0x)
      crash = 2.0 + Math.random() * 1.0;
    } else {
      // Remaining 20% probability: Low flight (1.0x to 2.0x)
      crash = 1.0 + Math.random() * 1.0;
    }
    
    crashPointRef.current = Math.min(crash, 1000);
    
    setStatus(GameStatus.FLYING);
    const startTime = Date.now();

    const update = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      // Exponential growth speed calculation
      const newMult = Math.pow(1.08, elapsed * 5);
      
      if (newMult >= crashPointRef.current) {
        handleCrash(crashPointRef.current);
      } else {
        setCurrentMultiplier(newMult);
        multiplierRef.current = newMult;
        animationFrameRef.current = requestAnimationFrame(update);
      }
    };
    animationFrameRef.current = requestAnimationFrame(update);
  };

  const handleCrash = (crash: number) => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setStatus(GameStatus.CRASHED);
    setLastCrashMultiplier(crash);
    setCurrentMultiplier(crash); // Snap display to exact crash point
    
    setHistory(prev => [{
      id: Date.now().toString(),
      multiplier: crash,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }, ...prev].slice(0, 30));

    // Update active bet and record in history if lost
    setActiveBet(prev => {
      if (prev && !prev.isCashedOut) {
        const lostBet: Bet = { ...prev, status: 'LOST' };
        setUserBets(historyPrev => [lostBet, ...historyPrev].slice(0, 50));
        return lostBet;
      }
      return prev;
    });

    setTimeout(prepareNextRound, 3000);
  };

  const handlePlaceBet = (amount: number) => {
    if (balance >= amount && (status === GameStatus.WAITING || status === GameStatus.IDLE)) {
      setBalance(prev => prev - amount);
      const newBet: Bet = {
        id: Date.now().toString(),
        amount,
        isCashedOut: false,
        timestamp: Date.now(),
        status: 'PENDING'
      };
      setActiveBet(newBet);
    }
  };

  const handleCashOut = useCallback(() => {
    if (activeBet && !activeBet.isCashedOut && status === GameStatus.FLYING) {
      const cashoutMultiplier = multiplierRef.current;
      const profit = activeBet.amount * cashoutMultiplier;
      
      const wonBet: Bet = { 
        ...activeBet, 
        isCashedOut: true, 
        multiplierAtCashout: cashoutMultiplier,
        status: 'WON'
      };

      setBalance(prev => prev + profit);
      setActiveBet(wonBet);
      setUserBets(prev => [wonBet, ...prev].slice(0, 50));
    }
  }, [activeBet, status]);

  return (
    <div className="flex flex-col h-screen max-h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <header className="flex items-center justify-between p-3 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 shrink-0 z-20">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-500 rounded-lg shadow-[0_0_20px_rgba(16,185,129,0.6)]">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </div>
          <span className="font-orbitron font-bold text-xl tracking-wider bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">
            SKY HIGH
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className={`bg-slate-800/80 px-4 py-1.5 rounded-full border border-slate-700 flex items-center gap-2 shadow-lg transition-all ${balanceAnimating ? 'animate-balance-pop border-emerald-500/50' : ''}`}>
            <span className="text-emerald-400 font-bold">$</span>
            <span className="font-mono text-lg font-semibold tabular-nums">{displayBalance.toFixed(2)}</span>
          </div>
          <button className="hidden sm:block p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row gap-2 p-2 bg-slate-950 overflow-hidden">
        <div className="hidden lg:flex w-72 flex-col gap-2 overflow-hidden">
          <UserBetHistory userBets={userBets} />
        </div>

        <div className="flex-1 flex flex-col gap-2 overflow-hidden">
          <StatsBar history={history} />
          
          <div className="flex-1 relative rounded-2xl overflow-hidden bg-[#050810] border border-slate-800/50 shadow-2xl">
            <GameCanvas 
              status={status} 
              multiplier={currentMultiplier} 
              countdown={countdown}
              lastCrash={lastCrashMultiplier}
            />
            
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
              {status === GameStatus.FLYING && (
                <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                  <span className="text-white text-7xl md:text-9xl font-orbitron font-black tracking-tight drop-shadow-[0_0_30px_rgba(255,255,255,0.4)]">
                    {currentMultiplier.toFixed(2)}x
                  </span>
                </div>
              )}
              {status === GameStatus.CRASHED && (
                <div className="flex flex-col items-center animate-in zoom-in duration-300">
                  <span className="text-rose-500 text-5xl md:text-7xl font-orbitron font-black mb-2 drop-shadow-[0_0_35px_rgba(244,63,94,0.7)]">
                    FLEW AWAY!
                  </span>
                  <span className="text-white text-4xl md:text-5xl font-orbitron font-bold opacity-80">
                    {currentMultiplier.toFixed(2)}x
                  </span>
                </div>
              )}
              {status === GameStatus.WAITING && (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(16,185,129,0.3)]"></div>
                  <span className="text-emerald-400 text-xl font-orbitron font-bold tracking-widest uppercase mb-1 drop-shadow-sm">
                    Waiting for Next Round
                  </span>
                  <span className="text-white text-4xl font-orbitron font-bold">
                    Starting in {countdown}s
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="shrink-0 h-fit">
            <BettingPanel 
              status={status}
              balance={balance}
              onPlaceBet={handlePlaceBet}
              onCashOut={handleCashOut}
              activeBet={activeBet}
              currentMultiplier={currentMultiplier}
            />
          </div>
        </div>

        <div className="hidden xl:flex w-80 flex-col gap-2 overflow-hidden">
          <HistoryPanel history={history} />
        </div>
      </main>

      <footer className="lg:hidden shrink-0 h-14 bg-slate-900 border-t border-slate-800 flex items-center justify-around px-4">
        <button className="flex flex-col items-center gap-1 text-emerald-500">
           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
           <span className="text-[10px] font-bold">GAME</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-500">
           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
           <span className="text-[10px] font-bold">HISTORY</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-500">
           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
           <span className="text-[10px] font-bold">MY BETS</span>
        </button>
      </footer>
    </div>
  );
};

export default App;
