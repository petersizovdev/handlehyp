import { describe, expect, it } from "vitest";
import { buildMarketOrderPrice } from "../client/market-order-policy.js";
import type { HyperliquidPerpetualMarket } from "../types/market.js";

const market: HyperliquidPerpetualMarket = {
  assetIndex: 0,
  coin: "BTC",
  symbol: "BTC-PERP",
  szDecimals: 5,
  maxLeverage: 50,
  marginTableId: 0,
  isDelisted: false,
  fundingRate: "0",
  openInterest: "0",
  previousDayPrice: "0",
  dailyNotionalVolume: "0",
  oraclePrice: "60000",
  markPrice: "60000",
  midPrice: "60000",
  premium: null,
};

describe("buildMarketOrderPrice", () => {
  it("moves buy price above reference by slippage", () => {
    expect(
      buildMarketOrderPrice(market, true, {
        referencePrice: "60000",
        slippageBps: 100,
      }),
    ).toBe("60600");
  });

  it("moves sell price below reference by slippage", () => {
    expect(
      buildMarketOrderPrice(market, false, {
        referencePrice: "60000",
        slippageBps: 100,
      }),
    ).toBe("59400");
  });

  it("does not use floating point arithmetic", () => {
    const preciseMarket = {
      ...market,
      szDecimals: 2,
    };

    expect(
      buildMarketOrderPrice(preciseMarket, true, {
        referencePrice: "1.2345",
        slippageBps: 10,
      }),
    ).toBe("1.2357");
  });

  it("rejects zero reference price", () => {
    expect(() =>
      buildMarketOrderPrice(market, true, {
        referencePrice: "0",
        slippageBps: 100,
      }),
    ).toThrow("referencePrice must be greater than zero");
  });

  it("rejects invalid slippage", () => {
    expect(() =>
      buildMarketOrderPrice(market, true, {
        referencePrice: "60000",
        slippageBps: 0,
      }),
    ).toThrow("slippageBps must be between 1 and 5000");
  });
});
