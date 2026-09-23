import { describe, expect, it } from "vitest";
import { VolumeSpikeStrategy } from "../../strategies/volume-spike.js";
import type { StrategyMarketData } from "../../domain/strategy.js";

function data(
  overrides: Partial<StrategyMarketData> = {},
): StrategyMarketData {
  return {
    coin: "BTC",
    price: "61000",
    previousPrice: "60000",
    volume: "50000000",
    previousVolume: "10000000",
    openInterest: "50000000",
    previousOpenInterest: "40000000",
    fundingRate: "0.0001",
    previousFundingRate: "0.00005",
    timestamp: 1_000_000,
    ...overrides,
  };
}

describe("VolumeSpikeStrategy", () => {
  it("detects volume spike with low price movement", () => {
    const strategy =
      new VolumeSpikeStrategy({
        minVolumeChangeBps: 100,
        maxPriceChangeBps: 50,
      });

    const result = strategy.evaluate(
      data({
        volume: "50000000",
        previousVolume: "10000000",
        price: "60050",
        previousPrice: "60000",
      }),
    );

    expect(result).not.toBeNull();
    expect(result!.strategyId).toBe(
      "volume-spike",
    );
    expect(result!.coin).toBe("BTC");
    expect(result!.evidence).toHaveLength(2);
    expect(
      result!.evidence[0],
    ).toMatchObject({
      metric: "volume",
    });
  });

  it("returns null when volume change below threshold", () => {
    const strategy =
      new VolumeSpikeStrategy({
        minVolumeChangeBps: 1000,
      });

    const result = strategy.evaluate(
      data({
        volume: "15000000",
        previousVolume: "10000000",
      }),
    );

    expect(result).toBeNull();
  });

  it("returns null when price moves too much", () => {
    const strategy =
      new VolumeSpikeStrategy({
        minVolumeChangeBps: 100,
        maxPriceChangeBps: 10,
      });

    const result = strategy.evaluate(
      data({
        volume: "50000000",
        previousVolume: "10000000",
        price: "62000",
        previousPrice: "60000",
      }),
    );

    expect(result).toBeNull();
  });

  it("returns null when previous volume is zero", () => {
    const strategy =
      new VolumeSpikeStrategy();

    const result = strategy.evaluate(
      data({
        volume: "50000000",
        previousVolume: "0",
      }),
    );

    expect(result).toBeNull();
  });

  it("detects bullish spike with slight price increase", () => {
    const strategy =
      new VolumeSpikeStrategy({
        minVolumeChangeBps: 100,
        maxPriceChangeBps: 20,
      });

    const result = strategy.evaluate(
      data({
        volume: "50000000",
        previousVolume: "10000000",
        price: "60100",
        previousPrice: "60000",
      }),
    );

    expect(result).not.toBeNull();
    expect(result!.side).toBe("buy");
  });

  it("detects bearish spike with slight price decrease", () => {
    const strategy =
      new VolumeSpikeStrategy({
        minVolumeChangeBps: 100,
        maxPriceChangeBps: 20,
      });

    const result = strategy.evaluate(
      data({
        volume: "50000000",
        previousVolume: "10000000",
        price: "59900",
        previousPrice: "60000",
      }),
    );

    expect(result).not.toBeNull();
    expect(result!.side).toBe("sell");
  });

  it("uses default configuration", () => {
    const strategy =
      new VolumeSpikeStrategy();

    const result = strategy.evaluate(
      data({
        volume: "50000000",
        previousVolume: "10000000",
        price: "60000",
        previousPrice: "60000",
      }),
    );

    expect(result).not.toBeNull();
  });
});
