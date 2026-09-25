export type OrderSide = "buy" | "sell";

export type OrderId = string;

export type ExecutionState =
  | "pending"
  | "maker_attempt"
  | "monitoring"
  | "partially_filled"
  | "filled_maker"
  | "timeout"
  | "fallback_attempt"
  | "filled_taker"
  | "completed"
  | "cancelled"
  | "failed";

export type ExecutionType = "maker" | "taker";

export interface PriceLevel {
  price: string;
  size: string;
}

export interface MarketSnapshot {
  midPrice: string;
  bestBid: string;
  bestAsk: string;
  bidLevels: PriceLevel[];
  askLevels: PriceLevel[];
}

export interface Fill {
  orderId: OrderId;
  price: string;
  size: string;
}

export interface ExecutionResult {
  orderId: OrderId;
  executionType: ExecutionType;
  totalFilled: string;
  fills: Fill[];
  averagePrice: string;
  state: ExecutionState;
}

export interface ExecutionMetrics {
  orderSize: string;
  totalFilled: string;
  averagePrice: string;
  executionType: ExecutionType;
  estimatedSavingsBps: number;
  builderFeeApplied: boolean;
  makerRebateEarned: boolean;
}
