import type {
  Fill,
  MarketSnapshot,
  OrderId,
  OrderSide,
} from "../domain/execution-types.js";

export interface MakerOrderRequest {
  coin: string;
  side: OrderSide;
  size: string;
  price: string;
  reduceOnly: boolean;
  postOnly: boolean;
}

export interface TakerOrderRequest {
  coin: string;
  side: OrderSide;
  size: string;
  reduceOnly: boolean;
  slippageBps: number;
}

export interface OrderStatus {
  orderId: OrderId;
  state:
    | "open"
    | "filled"
    | "partially_filled"
    | "cancelled"
    | "rejected"
    | "expired";
  filled: string;
  remaining: string;
  fills: Fill[];
}

export interface ExecutionExchangePort {
  submitMakerOrder(
    order: MakerOrderRequest,
  ): Promise<OrderId>;

  submitTakerOrder(
    order: TakerOrderRequest,
  ): Promise<OrderId>;

  cancelOrder(
    orderId: OrderId,
  ): Promise<void>;

  replaceOrder(
    orderId: OrderId,
    newPrice: string,
  ): Promise<OrderId>;

  getOrderStatus(
    orderId: OrderId,
  ): Promise<OrderStatus>;
}

export interface MarketDataProvider {
  getMarketSnapshot(
    coin: string,
  ): Promise<MarketSnapshot>;
}

export interface Clock {
  now(): number;
}

export interface ExecutionContext {
  exchange: ExecutionExchangePort;
  marketData: MarketDataProvider;
  clock: Clock;
  pollIntervalMs: number;
  poll(
    ms: number,
  ): Promise<void>;
}
