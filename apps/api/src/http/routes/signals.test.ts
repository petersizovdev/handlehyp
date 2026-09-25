import Fastify from "fastify";
import { describe, expect, it, vi } from "vitest";

vi.mock("@handlehyp/strategies", () => ({
  StrategyEngine: class {
    evaluate = vi.fn();
  },
  OIAnomalyStrategy: class {},
  VolumeSpikeStrategy: class {},
  FundingExtremeStrategy: class {},
  WhaleAccumulationStrategy: class {},
  LiquidationCascadeStrategy: class {},
}));
vi.mock("../../signal-store.js", () => ({
  InMemorySignalStore: class {
    getByCoin = vi.fn().mockResolvedValue([]);
  },
}));

import { signalsRoutes } from "./signals.js";

describe("GET /signals", () => {
  it("returns active signals", async () => {
    const app = Fastify();

    await app.register(signalsRoutes);

    const response = await app.inject({
      method: "GET",
      url: "/signals",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([]);

    await app.close();
  });
});

describe("POST /signals/evaluate", () => {
  it("evaluates market data and returns signals", async () => {
    const app = Fastify();

    await app.register(signalsRoutes);

    const response = await app.inject({
      method: "POST",
      url: "/signals/evaluate",
      payload: {
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
      },
    });

    expect(response.statusCode).toBe(200);

    await app.close();
  });
});
