import { describe, expect, it } from "vitest";
import { FundingExtremeStrategy } from "../../strategies/funding-extreme.js";
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

describe("FundingExtremeStrategy", () => {
  it("detects extreme positive funding", () => {
    const strategy = new FundingExtremeStrategy();

    const result = strategy.evaluate(
      data({
        fundingRate: "0.01",
        previousFundingRate: "0.00005",
      }),
    );

    expect(result).not.toBeNull();
    expect(result!.strategyId).toBe("funding-extreme");
    expect(result!.coin).toBe("BTC");
    expect(result!.side).toBe("sell");
    expect(result!.evidence).toHaveLength(2);
    expect(result!.evidence[0]).toMatchObject({
      metric: "fundingRate",
    });
  });

  it("detects extreme negative funding", () => {
    const strategy = new FundingExtremeStrategy();

    const result = strategy.evaluate(
      data({
        fundingRate: "-0.01",
        previousFundingRate: "0.00005",
      }),
    );

    expect(result).not.toBeNull();
    expect(result!.side).toBe("buy");
  });

  it("returns null when funding change below threshold", () => {
    const strategy = new FundingExtremeStrategy({
      minFundingChangeBps: 500,
    });

    const result = strategy.evaluate(
      data({
        fundingRate: "0.0001",
        previousFundingRate: "0.00005",
      }),
    );

    expect(result).toBeNull();
  });

  it("returns null when funding not extreme", () => {
    const strategy = new FundingExtremeStrategy({
      extremeFundingBps: 200,
    });

    const result = strategy.evaluate(
      data({
        fundingRate: "0.0001",
        previousFundingRate: "0.00005",
      }),
    );

    expect(result).toBeNull();
  });

  it("returns null when both funding rates are zero", () => {
    const strategy = new FundingExtremeStrategy();

    const result = strategy.evaluate(
      data({
        fundingRate: "0",
        previousFundingRate: "0",
      }),
    );

    expect(result).toBeNull();
  });

  it("uses default configuration", () => {
    const strategy = new FundingExtremeStrategy();

    const result = strategy.evaluate(
      data({
        fundingRate: "0.01",
        previousFundingRate: "0.00005",
      }),
    );

    expect(result).not.toBeNull();
  });
});
