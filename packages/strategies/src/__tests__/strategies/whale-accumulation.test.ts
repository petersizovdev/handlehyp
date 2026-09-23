import { describe, expect, it } from "vitest";
import { WhaleAccumulationStrategy } from "../../strategies/whale-accumulation.js";
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

describe("WhaleAccumulationStrategy", () => {
  it("detects whale accumulation", () => {
    const strategy = new WhaleAccumulationStrategy();

    const result = strategy.evaluate(
      data({
        volume: "50000000",
        previousVolume: "10000000",
        openInterest: "50000000",
        previousOpenInterest: "40000000",
      }),
    );

    expect(result).not.toBeNull();
    expect(result!.strategyId).toBe("whale-accumulation");
    expect(result!.coin).toBe("BTC");
    expect(result!.side).toBe("buy");
    expect(result!.evidence).toHaveLength(2);
    expect(result!.evidence[0]).toMatchObject({
      metric: "volume",
    });
  });

  it("returns null when volume change below threshold", () => {
    const strategy = new WhaleAccumulationStrategy({
      minVolumeChangeBps: 10000,
    });

    const result = strategy.evaluate(
      data({
        volume: "15000000",
        previousVolume: "10000000",
        openInterest: "50000000",
        previousOpenInterest: "40000000",
      }),
    );

    expect(result).toBeNull();
  });

  it("returns null when OI change below threshold", () => {
    const strategy = new WhaleAccumulationStrategy({
      minOiChangeBps: 10000,
    });

    const result = strategy.evaluate(
      data({
        volume: "50000000",
        previousVolume: "10000000",
        openInterest: "41000000",
        previousOpenInterest: "40000000",
      }),
    );

    expect(result).toBeNull();
  });

  it("returns null when volume is zero", () => {
    const strategy = new WhaleAccumulationStrategy();

    const result = strategy.evaluate(
      data({
        volume: "0",
        previousVolume: "10000000",
      }),
    );

    expect(result).toBeNull();
  });

  it("returns null when OI is zero", () => {
    const strategy = new WhaleAccumulationStrategy();

    const result = strategy.evaluate(
      data({
        volume: "50000000",
        previousVolume: "10000000",
        openInterest: "0",
        previousOpenInterest: "40000000",
      }),
    );

    expect(result).toBeNull();
  });

  it("uses default configuration", () => {
    const strategy = new WhaleAccumulationStrategy();

    const result = strategy.evaluate(
      data({
        volume: "50000000",
        previousVolume: "10000000",
        openInterest: "50000000",
        previousOpenInterest: "40000000",
      }),
    );

    expect(result).not.toBeNull();
  });
});
