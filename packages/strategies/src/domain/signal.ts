export type SignalSide = "buy" | "sell";

export type SignalStatus =
  | "active"
  | "resolved"
  | "expired";

export type SignalOutcome =
  | "win"
  | "loss"
  | "breakeven"
  | "pending";

export interface SignalEvidence {
  metric: string;
  value: string;
  threshold: string;
  direction: "above" | "below";
  description: string;
}

export interface Signal {
  id: string;
  strategyId: string;
  name: string;
  coin: string;
  side: SignalSide;
  confidence: number;
  evidence: SignalEvidence[];
  entryPrice: string;
  timestamp: number;
  expiresAt: number;
  status: SignalStatus;
  metadata: Record<string, unknown>;
  resolution?: SignalResolution;
}

export interface SignalResolution {
  signalId: string;
  outcome: SignalOutcome;
  exitPrice: string;
  returnBps: number;
  resolvedAt: number;
}
