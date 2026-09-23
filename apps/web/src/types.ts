export interface MiniAppSignal {
  id: string;
  strategyId: string;
  name: string;
  coin: string;
  side: "buy" | "sell";
  confidence: number;
  entryPrice: string;
  evidence: MiniAppEvidenceItem[];
}

export interface MiniAppEvidenceItem {
  metric: string;
  value: string;
  threshold: string;
  direction: "above" | "below";
  description: string;
}

export interface SignalCatalogState {
  signals: MiniAppSignal[];
  selectedSignalId: string | null;
}

export interface TradingAction {
  type: "buy" | "sell";
  coin: string;
  size: string;
  signalId?: string;
}

export interface MiniAppState {
  user?: {
    id: number;
    firstName?: string;
    username?: string;
  };
  catalog: SignalCatalogState;
}
