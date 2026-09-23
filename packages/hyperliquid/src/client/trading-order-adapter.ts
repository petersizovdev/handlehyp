import type {
  HyperliquidOrderAction,
  BuildOrderInput,
} from "../types/order.js";
import { buildHyperliquidOrderAction } from "./order-builder.js";
import { HyperliquidMarketRegistry } from "./market-registry.js";
import { buildMarketOrderPrice } from "./market-order-policy.js";

import type {
  HyperliquidTradingBuilder,
  HyperliquidTradingOrder,
} from "../types/trading-adapter.js";

export interface HyperliquidTradingOrderAdapterOptions {
  marketRegistry: HyperliquidMarketRegistry;
  builder?: HyperliquidTradingBuilder;
}

export class HyperliquidTradingOrderAdapter {
  private readonly marketRegistry: HyperliquidMarketRegistry;
  private readonly builder: HyperliquidTradingBuilder | undefined;

  constructor(
    options: HyperliquidTradingOrderAdapterOptions,
  ) {
    this.marketRegistry =
      options.marketRegistry;

    this.builder =
      options.builder;
  }

  build(
    order: HyperliquidTradingOrder,
  ): HyperliquidOrderAction {
    const market =
      this.marketRegistry.get(
        order.coin,
      );

    let price: string;
    let tif: "Gtc" | "Ioc";

    if (
      order.type === "limit"
    ) {
      if (
        order.limitPrice ===
        undefined
      ) {
        throw new Error(
          "Limit order requires limitPrice",
        );
      }

      price =
        order.limitPrice;

      tif = "Gtc";
    } else {
      if (
        order.marketOrderPolicy ===
        undefined
      ) {
        throw new Error(
          "Market orders require a market price/slippage policy before wire construction",
        );
      }

      price =
        buildMarketOrderPrice(
          this.marketRegistry.getMarket(
            order.coin,
          ),
          order.side === "buy",
          order.marketOrderPolicy,
        );

      tif = "Ioc";
    }

    const input: BuildOrderInput = {
      asset: market.asset,

      isBuy:
        order.side === "buy",

      size:
        order.size,

      price,

      reduceOnly:
        order.reduceOnly,

      tif,
    };

    if (
      this.builder !==
      undefined
    ) {
      input.builder = {
        b:
          this.builder.address,

        f:
          this.builder.feeRate,
      };
    }

    return buildHyperliquidOrderAction(
      input,
    );
  }
}
