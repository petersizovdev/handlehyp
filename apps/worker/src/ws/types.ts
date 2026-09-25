export type WsChannel =
  | "allMids"
  | "l2Book"
  | "trades"
  | "candle";

export interface Subscription {
  type: WsChannel;
  coin?: string;
  interval?: string;
}

export interface AllMidsData {
  channel: "allMids";
  data: {
    mid: Record<string, string>;
  };
}

export interface L2BookData {
  channel: "l2Book";
  data: {
    coin: string;
    levels: Array<{
      price: string;
      sz: string;
      n?: number;
    }>;
    time: number;
  };
}

export interface TradesData {
  channel: "trades";
  data: {
    coin: string;
    trades: Array<{
      price: string;
      size: string;
      side: "buy" | "sell";
      time: number;
    }>;
  };
}

export type WsMessage = AllMidsData | L2BookData | TradesData;

export interface WsConnectionOptions {
  url?: string;
  reconnectDelayMs?: number;
  pingIntervalMs?: number;
}

export const DEFAULT_WS_URL =
  "wss://api.hyperliquid.xyz/ws";
