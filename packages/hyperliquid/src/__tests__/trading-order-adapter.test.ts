import { describe, expect, it } from "vitest";
import { HyperliquidMarketRegistry } from "../client/market-registry.js";
import { HyperliquidTradingOrderAdapter } from "../client/trading-order-adapter.js";
import type { HyperliquidPerpetualMarket } from "../types/market.js";
import type { HyperliquidTradingOrder } from "../types/trading-adapter.js";

function createMarket(
  coin = "BTC",
  assetIndex = 0,
): HyperliquidPerpetualMarket {
  return {
    assetIndex,
    coin,
    symbol: `${coin}-PERP`,
    szDecimals: 5,
    maxLeverage: 50,
    marginTableId: 0,
    isDelisted: false,
    fundingRate: "0",
    openInterest: "0",
    previousDayPrice: "0",
    dailyNotionalVolume: "0",
    oraclePrice: "0",
    markPrice: "0",
    midPrice: null,
    premium: null,
  };
}

function createRegistry(): HyperliquidMarketRegistry {
  return new HyperliquidMarketRegistry([createMarket()]);
}

function createLimitOrder(
  overrides: Partial<HyperliquidTradingOrder> = {},
): HyperliquidTradingOrder {
  return {
    coin: "BTC",
    side: "buy",
    type: "limit",
    size: "0.01",
    limitPrice: "60000",
    reduceOnly: false,
    ...overrides,
  };
}

describe("HyperliquidTradingOrderAdapter", () => {
  it("converts a validated trading order into exact Hyperliquid wire action", () => {
    const adapter = new HyperliquidTradingOrderAdapter({
      marketRegistry: createRegistry(),
      builder: {
        address:
          "0x14791697260E4c9A71f18484C9f997B308e59325",
        feeRate: 10,
      },
    });

    expect(adapter.build(createLimitOrder())).toEqual({
      type: "order",
      orders: [
        {
          a: 0,
          b: true,
          p: "60000",
          s: "0.01",
          r: false,
          t: {
            limit: {
              tif: "Gtc",
            },
          },
        },
      ],
      grouping: "na",
      builder: {
        b:
          "0x14791697260E4c9A71f18484C9f997B308e59325",
        f: 10,
      },
    });
  });

  it("supports reduce-only sell orders", () => {
    const adapter = new HyperliquidTradingOrderAdapter({
      marketRegistry: createRegistry(),
      builder: {
        address:
          "0x14791697260E4c9A71f18484C9f997B308e59325",
        feeRate: 10,
      },
    });

    expect(
      adapter.build(
        createLimitOrder({
          side: "sell",
          reduceOnly: true,
        }),
      ),
    ).toEqual({
      type: "order",
      orders: [
        {
          a: 0,
          b: false,
          p: "60000",
          s: "0.01",
          r: true,
          t: {
            limit: {
              tif: "Gtc",
            },
          },
        },
      ],
      grouping: "na",
      builder: {
        b:
          "0x14791697260E4c9A71f18484C9f997B308e59325",
        f: 10,
      },
    });
  });

  it("rejects a coin that is not present in the registry", () => {
    const adapter = new HyperliquidTradingOrderAdapter({
      marketRegistry: createRegistry(),
      builder: {
        address:
          "0x14791697260E4c9A71f18484C9f997B308e59325",
        feeRate: 10,
      },
    });

    expect(() =>
      adapter.build(
        createLimitOrder({
          coin: "ETH",
        }),
      ),
    ).toThrow("Unknown Hyperliquid perpetual market: ETH");
  });

  it("does not silently invent market-order pricing", () => {
    const adapter = new HyperliquidTradingOrderAdapter({
      marketRegistry: createRegistry(),
      builder: {
        address:
          "0x14791697260E4c9A71f18484C9f997B308e59325",
        feeRate: 10,
      },
    });

    expect(() =>
      adapter.build(
        createLimitOrder({
          type: "market",
        }),
      ),
    ).toThrow(
      "Market orders require a market price/slippage policy before wire construction",
    );
  });

  it("builds market orders as IOC orders using explicit slippage policy", () => {
    const adapter = new HyperliquidTradingOrderAdapter({
      marketRegistry: createRegistry(),
      builder: {
        address:
          "0x14791697260E4c9A71f18484C9f997B308e59325",
        feeRate: 10,
      },
    });

    expect(
      adapter.build(
        createLimitOrder({
          type: "market",
          marketOrderPolicy: {
            referencePrice: "60000",
            slippageBps: 100,
          },
        }),
      ),
    ).toEqual({
      type: "order",
      orders: [
        {
          a: 0,
          b: true,
          p: "60600",
          s: "0.01",
          r: false,
          t: {
            limit: {
              tif: "Ioc",
            },
          },
        },
      ],
      grouping: "na",
      builder: {
        b:
          "0x14791697260E4c9A71f18484C9f997B308e59325",
        f: 10,
      },
    });
  });
});

