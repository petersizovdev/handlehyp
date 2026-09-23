import { describe, expect, it, vi } from "vitest";

import { MarketService } from "../client/market-service.js";
import type { MetaAndAssetCtxsResponse } from "../types/info.js";

describe("MarketService", () => {
  it("loads and normalizes perpetual markets", async () => {
    const response: MetaAndAssetCtxsResponse = [
      {
        universe: [
          {
            name: "BTC",
            szDecimals: 5,
            maxLeverage: 40,
            marginTableId: 56,
          },
        ],
      },
      [
        {
          funding: "0.0001",
          openInterest: "1234.5",
          prevDayPx: "60000",
          dayNtlVlm: "100000000",
          oraclePx: "61000",
          markPx: "61010",
          midPx: "61005",
          premium: "0.0001",
        },
      ],
    ];

    const client = {
      metaAndAssetCtxs: vi.fn().mockResolvedValue(response),
    };

    const service = new MarketService({ client });

    const markets = await service.getPerpetualMarkets();

    expect(client.metaAndAssetCtxs).toHaveBeenCalledOnce();
    expect(markets).toHaveLength(1);

    expect(markets[0]).toEqual({
      assetIndex: 0,
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
    });
  });

  it("passes dex to the Hyperliquid client", async () => {
    const response: MetaAndAssetCtxsResponse = [
      { universe: [] },
      [],
    ];

    const client = {
      metaAndAssetCtxs: vi.fn().mockResolvedValue(response),
    };

    const service = new MarketService({ client });

    await service.getPerpetualMarkets("test-dex");

    expect(client.metaAndAssetCtxs).toHaveBeenCalledWith("test-dex");
  });
});
