import { describe, expect, it, vi } from "vitest";
import { StrategyEngine } from "../../engine/strategy-engine.js";
import { OIAnomalyStrategy } from "../../strategies/oi-anomaly.js";
import type {
  SignalStore,
} from "../../domain/signal-store.js";
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

function createMockStore(): SignalStore & {
  save: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
  getActive: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  resolve: ReturnType<typeof vi.fn>;
  getByCoin: ReturnType<typeof vi.fn>;
} {
  return {
    save: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(null),
    getByCoin: vi
      .fn()
      .mockResolvedValue([]),
    update: vi.fn().mockResolvedValue(undefined),
    resolve: vi.fn().mockResolvedValue(undefined),
    getActive: vi
      .fn()
      .mockResolvedValue([]),
  };
}

describe("StrategyEngine", () => {
  it("evaluates market data with registered strategies", async () => {
    const store = createMockStore();

    const engine = new StrategyEngine({
      strategies: [
        new OIAnomalyStrategy({
          minOiChangeBps: 100,
          maxPriceChangeBps: 50,
        }),
      ],
      signalStore: store,
    });

    const result = await engine.evaluate(
      data({
        openInterest: "44000000",
        previousOpenInterest: "40000000",
        price: "60050",
        previousPrice: "60000",
      }),
    );

    expect(result).toHaveLength(1);
    expect(
      result[0]!.strategyId,
    ).toBe("oi-anomaly");
    expect(
      store.save,
    ).toHaveBeenCalledOnce();
  });

  it("evaluates with multiple strategies", async () => {
    const store = createMockStore();

    const engine = new StrategyEngine({
      strategies: [
        new OIAnomalyStrategy({
          minOiChangeBps: 100,
          maxPriceChangeBps: 50,
        }),
        new OIAnomalyStrategy({
          minOiChangeBps: 100,
          maxPriceChangeBps: 50,
        }),
      ],
      signalStore: store,
    });

    const result = await engine.evaluate(
      data({
        openInterest: "44000000",
        previousOpenInterest: "40000000",
        price: "60050",
        previousPrice: "60000",
      }),
    );

    expect(result).toHaveLength(2);
    expect(
      store.save,
    ).toHaveBeenCalledTimes(2);
  });

  it("returns empty array when no signals triggered", async () => {
    const store = createMockStore();

    const engine = new StrategyEngine({
      strategies: [
        new OIAnomalyStrategy({
          minOiChangeBps: 10000,
        }),
      ],
      signalStore: store,
    });

    const result = await engine.evaluate(
      data(),
    );

    expect(result).toHaveLength(0);
    expect(
      store.save,
    ).not.toHaveBeenCalled();
  });

  it("gets active signals from store", async () => {
    const store = createMockStore();
    store.getActive.mockResolvedValueOnce([
      {
        id: "sig-1",
        strategyId: "oi-anomaly",
        name: "OI Anomaly",
        coin: "BTC",
        side: "buy",
        confidence: 70,
        evidence: [],
        entryPrice: "60000",
        timestamp: 1_000_000,
        expiresAt: 2_000_000,
        status: "active" as const,
        metadata: {},
      },
    ]);

    const engine = new StrategyEngine({
      strategies: [],
      signalStore: store,
    });

    const result =
      await engine.getActiveSignals("BTC");

    expect(result).toHaveLength(1);
    expect(
      store.getActive,
    ).toHaveBeenCalledWith("BTC");
  });

  it("resolves a signal", async () => {
    const store = createMockStore();
    store.get.mockResolvedValueOnce({
      id: "sig-1",
      strategyId: "oi-anomaly",
      name: "OI Anomaly",
      coin: "BTC",
      side: "buy",
      confidence: 70,
      evidence: [],
      entryPrice: "60000",
      timestamp: 1_000_000,
      expiresAt: 2_000_000,
      status: "active" as const,
      metadata: {},
    });

    const engine = new StrategyEngine({
      strategies: [],
      signalStore: store,
    });

    await engine.resolve("sig-1", {
      signalId: "sig-1",
      outcome: "win",
      exitPrice: "61000",
      returnBps: 100,
      resolvedAt: 2_000_000,
    });

    expect(
      store.update,
    ).toHaveBeenCalledOnce();
    expect(
      store.resolve,
    ).toHaveBeenCalledOnce();
  });

  it("throws on unknown signal id", async () => {
    const store = createMockStore();
    store.get.mockResolvedValueOnce(null);

    const engine = new StrategyEngine({
      strategies: [],
      signalStore: store,
    });

    await expect(
      engine.resolve("unknown", {
        signalId: "unknown",
        outcome: "win",
        exitPrice: "61000",
        returnBps: 100,
        resolvedAt: 2_000_000,
      }),
    ).rejects.toThrow(
      "Unknown signal: unknown",
    );
  });

  it("generates deterministic signal IDs", async () => {
    const store = createMockStore();

    const engine = new StrategyEngine({
      strategies: [
        new OIAnomalyStrategy({
          minOiChangeBps: 100,
          maxPriceChangeBps: 50,
        }),
      ],
      signalStore: store,
    });

    const result = await engine.evaluate(
      data({
        openInterest: "44000000",
        previousOpenInterest: "40000000",
        price: "60050",
        previousPrice: "60000",
      }),
    );

    expect(result[0]!.id).toBe(
      "oi-anomaly:btc:1000000",
    );
  });

  it("uses custom TTL for signal expiry", async () => {
    const store = createMockStore();

    const engine = new StrategyEngine({
      strategies: [
        new OIAnomalyStrategy({
          minOiChangeBps: 100,
          maxPriceChangeBps: 50,
        }),
      ],
      signalStore: store,
      defaultTtlMs: 300_000,
    });

    const result = await engine.evaluate(
      data({
        openInterest: "44000000",
        previousOpenInterest: "40000000",
        price: "60050",
        previousPrice: "60000",
      }),
    );

    expect(result[0]!.expiresAt).toBe(
      1_000_000 + 300_000,
    );
  });
});
