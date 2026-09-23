import { describe, expect, it } from "vitest";
import { LiquidationCascadeStrategy } from "../../strategies/liquidation-cascade.js";
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

describe("LiquidationCascadeStrategy", () => {
  it("detects liquidation cascade with sharp price drop and high volume", () => {
    const strategy = new LiquidationCascadeStrategy();

    const result = strategy.evaluate(
      data({
        price: "55000",
        previousPrice: "60000",
        volume: "50000000",
        previousVolume: "10000000",
      }),
    );

    expect(result).not.toBeNull();
    expect(result!.strategyId).toBe("liquidation-cascade");
    expect(result!.coin).toBe("BTC");
    expect(result!.side).toBe("sell");
    expect(result!.evidence).toHaveLength(2);
    expect(result!.evidence[0]).toMatchObject({
      metric: "price",
    });
  });

  it("detects cascade with sharp price increase and high volume", () => {
    const strategy = new LiquidationCascadeStrategy();

    const result = strategy.evaluate(
      data({
        price: "65000",
        previousPrice: "60000",
        volume: "50000000",
        previousVolume: "10000000",
      }),
    );

    expect(result).not.toBeNull();
    expect(result!.side).toBe("buy");
  });

  it("returns null when price change below threshold", () => {
    const strategy = new LiquidationCascadeStrategy({
      minPriceChangeBps: 500,
    });

    const result = strategy.evaluate(
      data({
        price: "61000",
        previousPrice: "60000",
        volume: "50000000",
        previousVolume: "10000000",
      }),
    );

    expect(result).toBeNull();
  });

  it("returns null when volume change below threshold", () => {
    const strategy = new LiquidationCascadeStrategy({
      minVolumeChangeBps: 10000,
    });

    const result = strategy.evaluate(
      data({
        price: "55000",
        previousPrice: "60000",
        volume: "15000000",
        previousVolume: "10000000",
      }),
    );

    expect(result).toBeNull();
  });

  it("returns null when previous price is zero", () => {
    const strategy = new LiquidationCascadeStrategy();

    const result = strategy.evaluate(
      data({
        price: "0",
        previousPrice: "60000",
        volume: "50000000",
        previousVolume: "10000000",
      }),
    );

    expect(result).toBeNull();
  });

  it("returns null when previous volume is zero", () => {
    const strategy = new LiquidationCascadeStrategy();

    const result = strategy.evaluate(
      data({
        price: "55000",
        previousPrice: "60000",
        volume: "50000000",
        previousVolume: "0",
      }),
    );

    expect(result).toBeNull();
  });

  it("uses default configuration", () => {
    const strategy = new LiquidationCascadeStrategy();

    const result = strategy.evaluate(
      data({
        price: "55000",
        previousPrice: "60000",
        volume: "50000000",
        previousVolume: "10000000",
      }),
    );

    expect(result).not.toBeNull();
  });
});
