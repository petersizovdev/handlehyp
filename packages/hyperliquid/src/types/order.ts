import type { Hex } from "viem";

export type HyperliquidTif = "Gtc" | "Ioc" | "Alo";

export interface HyperliquidLimitOrderType {
  limit: {
    tif: HyperliquidTif;
  };
}

export interface HyperliquidOrderWire {
  a: number;
  b: boolean;
  p: string;
  s: string;
  r: boolean;
  t: HyperliquidLimitOrderType;
  c?: string;
}

export interface HyperliquidBuilder {
  b: Hex;
  f: number;
}

export interface HyperliquidOrderAction {
  type: "order";
  orders: HyperliquidOrderWire[];
  grouping: "na";
  builder?: HyperliquidBuilder;
}

export interface BuildOrderInput {
  asset: number;
  isBuy: boolean;
  size: string;
  price: string;
  reduceOnly?: boolean;
  tif?: HyperliquidTif;
  cloid?: string;
  builder?: HyperliquidBuilder;
}
