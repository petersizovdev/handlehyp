import { describe, expect, it } from "vitest";
import { OIAnomalyStrategy } from "../../strategies/oi-anomaly.js";
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

describe("OIAnomalyStrategy", () => {
  it("detects when OI spikes without price movement", () => {
    const strategy =
      new OIAnomalyStrategy({
        minOiChangeBps: 100,
        maxPriceChangeBps: 50,
      });

    const result = strategy.evaluate(
      data({
        openInterest: "44000000",
        previousOpenInterest: "40000000",
        price: "60050",
        previousPrice: "60000",
      }),
    );

    expect(result).not.toBeNull();
    expect(result!.strategyId).toBe(
      "oi-anomaly",
    );
    expect(result!.coin).toBe("BTC");
    expect(result!.side).toBe("buy");
    expect(result!.confidence).toBeGreaterThanOrEqual(
      60,
    );
    expect(result!.evidence).toHaveLength(2);
    expect(
      result!.evidence[0],
    ).toMatchObject({
      metric: "openInterest",
    });
  });

  it("returns null when OI change below threshold", () => {
    const strategy =
      new OIAnomalyStrategy({
        minOiChangeBps: 500,
      });

    const result = strategy.evaluate(
      data({
        openInterest: "41000000",
        previousOpenInterest: "40000000",
      }),
    );

    expect(result).toBeNull();
  });

  it("returns null when price moves proportionally", () => {
    const strategy =
      new OIAnomalyStrategy({
        minOiChangeBps: 100,
        maxPriceChangeBps: 30,
      });

    const result = strategy.evaluate(
      data({
        openInterest: "44000000",
        previousOpenInterest: "40000000",
        price: "60000",
        previousPrice: "58000",
      }),
    );

    expect(result).toBeNull();
  });

  it("returns null when previous OI is zero", () => {
    const strategy =
      new OIAnomalyStrategy();

    const result = strategy.evaluate(
      data({
        openInterest: "40000000",
        previousOpenInterest: "0",
      }),
    );

    expect(result).toBeNull();
  });

  it("detects bearish OI decrease", () => {
    const strategy =
      new OIAnomalyStrategy({
        minOiChangeBps: 100,
        maxPriceChangeBps: 50,
      });

    const result = strategy.evaluate(
      data({
        openInterest: "36000000",
        previousOpenInterest: "40000000",
        price: "60000",
        previousPrice: "60000",
      }),
    );

    expect(result).not.toBeNull();
    expect(result!.side).toBe("sell");
  });

  it("uses default configuration", () => {
    const strategy =
      new OIAnomalyStrategy();

    const result = strategy.evaluate(
      data({
        openInterest: "50000000",
        previousOpenInterest: "40000000",
        price: "60000",
        previousPrice: "60000",
      }),
    );

    expect(result).not.toBeNull();
  });
});
