export interface StrategyMarketData {
  coin: string;
  price: string;
  previousPrice: string;
  volume: string;
  previousVolume: string;
  openInterest: string;
  previousOpenInterest: string;
  fundingRate: string;
  previousFundingRate: string;
  timestamp: number;
}

export interface Strategy {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly side: "buy" | "sell";

  evaluate(
    input: StrategyMarketData,
  ): SignalCandidate | null;
}

export interface SignalCandidate {
  strategyId: string;
  name: string;
  coin: string;
  side: "buy" | "sell";
  confidence: number;
  evidence: SignalEvidenceItem[];
  entryPrice: string;
  metadata: Record<string, unknown>;
}

export interface SignalEvidenceItem {
  metric: string;
  value: string;
  threshold: string;
  direction: "above" | "below";
  description: string;
}
