
export enum GameStatus {
  IDLE = 'IDLE',
  WAITING = 'WAITING',
  FLYING = 'FLYING',
  CRASHED = 'CRASHED'
}

export interface Bet {
  id: string;
  amount: number;
  multiplierAtCashout?: number;
  isCashedOut: boolean;
  timestamp: number;
  status: 'WON' | 'LOST' | 'PENDING';
}

export interface HistoryItem {
  id: string;
  multiplier: number;
  time: string;
}

export interface LivePlayer {
  id: string;
  name: string;
  bet: number;
  cashout?: number;
}
