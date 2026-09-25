import type { MarketOrderPolicyOptions } from "../client/market-order-policy.js";
import type { Hex } from "viem";

export type TradingOrderSide = "buy" | "sell";
export type TradingOrderType = "market" | "limit";

export interface HyperliquidTradingOrder {
  coin: string;
  side: TradingOrderSide;
  type: TradingOrderType;
  size: string;
  limitPrice?: string;
  marketOrderPolicy?: MarketOrderPolicyOptions;
  reduceOnly: boolean;
}

export interface HyperliquidOrderMarket {
  coin: string;
  asset: number;
}

export interface HyperliquidTradingBuilder {
  address: Hex;
  feeRate: number;
}
