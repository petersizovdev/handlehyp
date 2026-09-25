import { describe, expect, it } from "vitest";

import { HyperliquidMarketRegistry } from "../client/market-registry.js";
import type { HyperliquidPerpetualMarket } from "../types/market.js";

function market(
  coin: string,
  assetIndex: number,
): HyperliquidPerpetualMarket {
  return {
    assetIndex,
    coin,
    symbol: coin,
    szDecimals: 5,
    maxLeverage: 50,
    marginTableId: 0,
    isDelisted: false,
    fundingRate: "0",
    openInterest: "0",
    previousDayPrice: "100",
    dailyNotionalVolume: "1000",
    oraclePrice: "100",
    markPrice: "100",
    midPrice: "100",
    premium: "0",
  };
}

describe("HyperliquidMarketRegistry", () => {
  it("resolves a coin to its Hyperliquid asset index", () => {
    const registry = new HyperliquidMarketRegistry([
      market("BTC", 0),
      market("ETH", 1),
      market("SOL", 5),
    ]);

    expect(registry.get("BTC")).toEqual({
      coin: "BTC",
      asset: 0,
    });

    expect(registry.get("SOL")).toEqual({
      coin: "SOL",
      asset: 5,
    });
  });

  it("resolves coins case-insensitively", () => {
    const registry = new HyperliquidMarketRegistry([
      market("BTC", 0),
    ]);

    expect(registry.get("btc")).toEqual({
      coin: "BTC",
      asset: 0,
    });

    expect(registry.get(" BtC ")).toEqual({
      coin: "BTC",
      asset: 0,
    });
  });

  it("rejects an unknown coin", () => {
    const registry = new HyperliquidMarketRegistry([
      market("BTC", 0),
    ]);

    expect(() => registry.get("DOGE")).toThrow(
      "Unknown Hyperliquid perpetual market: DOGE",
    );
  });

  it("rejects duplicate coins", () => {
    expect(
      () =>
        new HyperliquidMarketRegistry([
          market("BTC", 0),
          market("btc", 1),
        ]),
    ).toThrow("Duplicate Hyperliquid market: BTC");
  });

  it("rejects invalid asset indexes", () => {
    expect(
      () =>
        new HyperliquidMarketRegistry([
          market("BTC", -1),
        ]),
    ).toThrow("Invalid Hyperliquid asset index for BTC");
  });

  it("reports whether a market exists", () => {
    const registry = new HyperliquidMarketRegistry([
      market("BTC", 0),
    ]);

    expect(registry.has("BTC")).toBe(true);
    expect(registry.has("btc")).toBe(true);
    expect(registry.has("ETH")).toBe(false);
    expect(registry.size()).toBe(1);
  });
});
