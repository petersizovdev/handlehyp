import type {
  NormalizedOrderIntent,
} from "@handlehyp/trading";

import type {
  HyperliquidOrderAction,
} from "../types/order.js";

import type {
  HyperliquidTradingOrder,
} from "../types/trading-adapter.js";

import {
  HyperliquidTradingOrderAdapter,
} from "../client/trading-order-adapter.js";

import type {
  ExchangeExecutionPort,
} from "./exchange-execution-port.js";

import type {
  NonceProvider,
} from "./nonce-provider.js";

export interface HyperliquidTradingOrderExecutorOptions {
  orderAdapter: HyperliquidTradingOrderAdapter;
  exchange: ExchangeExecutionPort;
  nonceProvider: NonceProvider;
}

export class HyperliquidTradingOrderExecutor {
  private readonly orderAdapter: HyperliquidTradingOrderAdapter;
  private readonly exchange: ExchangeExecutionPort;
  private readonly nonceProvider: NonceProvider;

  constructor(
    options: HyperliquidTradingOrderExecutorOptions,
  ) {
    this.orderAdapter = options.orderAdapter;
    this.exchange = options.exchange;
    this.nonceProvider = options.nonceProvider;
  }

  async executeOrder(
    order: NormalizedOrderIntent,
  ): Promise<unknown> {
    const hyperliquidOrder: HyperliquidTradingOrder = {
      coin: order.coin,
      side: order.side,
      type: order.type,
      size: order.size,
      ...(order.limitPrice !== undefined
        ? { limitPrice: order.limitPrice }
        : {}),
      reduceOnly: order.reduceOnly,
    };

    const action: HyperliquidOrderAction =
      this.orderAdapter.build(hyperliquidOrder);

    const nonce = this.nonceProvider.next();

    return this.exchange.execute(action, nonce);
  }
}
