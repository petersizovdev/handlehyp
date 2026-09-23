import { describe, expect, it } from "vitest";
import { mapPerpetualMarkets } from "../client/market-mapper.js";
import type { MetaAndAssetCtxsResponse } from "../types/info.js";

describe("mapPerpetualMarkets", () => {
  it("maps metadata and asset context by index", () => {
    const response: MetaAndAssetCtxsResponse = [
      {
        universe: [
          {
            name: "BTC",
            szDecimals: 5,
            maxLeverage: 50,
            marginTableId: 0,
          },
        ],
      },
      [
        {
          funding: "0.0001",
          openInterest: "123.45",
          prevDayPx: "60000",
          dayNtlVlm: "1000000",
          oraclePx: "60100",
          markPx: "60110",
          midPx: "60105",
          premium: "0.0002",
        },
      ],
    ];

    expect(mapPerpetualMarkets(response)).toEqual([
      {
        assetIndex: 0,
        coin: "BTC",
        symbol: "BTC-PERP",
        szDecimals: 5,
        maxLeverage: 50,
        marginTableId: 0,
        isDelisted: false,
        fundingRate: "0.0001",
        openInterest: "123.45",
        previousDayPrice: "60000",
        dailyNotionalVolume: "1000000",
        oraclePrice: "60100",
        markPrice: "60110",
        midPrice: "60105",
        premium: "0.0002",
      },
    ]);
  });

  it("preserves delisted status", () => {
    const response: MetaAndAssetCtxsResponse = [
      {
        universe: [
          {
            name: "BTC",
            szDecimals: 5,
            maxLeverage: 50,
            marginTableId: 0,
            isDelisted: true,
          },
        ],
      },
      [
        {
          funding: "0",
          openInterest: "0",
          prevDayPx: "0",
          dayNtlVlm: "0",
          oraclePx: "0",
          markPx: "0",
        },
      ],
    ];

    expect(mapPerpetualMarkets(response)[0]?.isDelisted).toBe(true);
  });

  it("fails when metadata and context arrays are inconsistent", () => {
    const response: MetaAndAssetCtxsResponse = [
      {
        universe: [
          {
            name: "BTC",
            szDecimals: 5,
          },
        ],
      },
      [],
    ];

    expect(() => mapPerpetualMarkets(response)).toThrow(
      "Missing asset context for Hyperliquid market BTC",
    );
  });
});
