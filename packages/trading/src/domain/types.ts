export type TradingSide = "buy" | "sell";

export type OrderType = "market" | "limit";

export interface TradingAccount {
  telegramUserId: number;
  walletAddress: string;
}

export interface OrderIntent {
  account: TradingAccount;
  coin: string;
  side: TradingSide;
  type: OrderType;
  size: string;
  limitPrice?: string;
  reduceOnly?: boolean;
}

export interface NormalizedOrderIntent extends OrderIntent {
  coin: string;
  size: string;
  limitPrice?: string;
  reduceOnly: boolean;
}
