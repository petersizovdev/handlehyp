import { describe, expect, it } from "vitest";

import { MarketService } from "../../client/market-service.js";

describe("MarketService integration", () => {
  it("loads real perpetual markets from Hyperliquid", async () => {
    const service = new MarketService();

    const markets = await service.getPerpetualMarkets();

    expect(markets.length).toBeGreaterThan(0);

    const btc = markets.find((market) => market.coin === "BTC");

    expect(btc).toBeDefined();
    expect(btc?.symbol).toBe("BTC-PERP");
    expect(btc?.assetIndex).toBe(0);
    expect(btc?.szDecimals).toBeGreaterThanOrEqual(0);
    expect(btc?.markPrice).toBeTruthy();
    expect(btc?.oraclePrice).toBeTruthy();
    expect(btc?.fundingRate).toBeTruthy();
  });
});
