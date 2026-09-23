import Fastify from "fastify";
import { describe, expect, it, vi } from "vitest";

const getPerpetualMarkets = vi.fn();

vi.mock("@handlehyp/hyperliquid", () => ({
  MarketService: class {
    getPerpetualMarkets = getPerpetualMarkets;
  },
}));

import { marketsRoutes } from "./markets.js";

const btcMarket = {
  coin: "BTC",
  symbol: "BTC-PERP",
  szDecimals: 5,
  maxLeverage: 40,
  marginTableId: 56,
  isDelisted: false,
  fundingRate: "0.0001",
  openInterest: "1234.5",
  previousDayPrice: "60000",
  dailyNotionalVolume: "100000000",
  oraclePrice: "61000",
  markPrice: "61010",
  midPrice: "61005",
  premium: "0.0001",
};

describe("GET /markets", () => {
  it("returns validated normalized perpetual markets", async () => {
    getPerpetualMarkets.mockResolvedValueOnce([btcMarket]);

    const app = Fastify();

    await app.register(marketsRoutes);

    const response = await app.inject({
      method: "GET",
      url: "/markets",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([btcMarket]);
    expect(getPerpetualMarkets).toHaveBeenCalledOnce();

    await app.close();
  });

  it("returns 502 when market data is unavailable", async () => {
    getPerpetualMarkets.mockRejectedValueOnce(
      new Error("Hyperliquid unavailable"),
    );

    const app = Fastify();

    await app.register(marketsRoutes);

    const response = await app.inject({
      method: "GET",
      url: "/markets",
    });

    expect(response.statusCode).toBe(502);
    expect(response.json()).toEqual({
      error: "MARKET_DATA_UNAVAILABLE",
      message: "Failed to load market data",
    });

    await app.close();
  });

  it("returns 502 when market data fails schema validation", async () => {
    getPerpetualMarkets.mockResolvedValueOnce([
      {
        ...btcMarket,
        markPrice: 61010,
      },
    ]);

    const app = Fastify();

    await app.register(marketsRoutes);

    const response = await app.inject({
      method: "GET",
      url: "/markets",
    });

    expect(response.statusCode).toBe(502);
    expect(response.json()).toEqual({
      error: "MARKET_DATA_UNAVAILABLE",
      message: "Failed to load market data",
    });

    await app.close();
  });
});
