import Fastify from "fastify";
import { describe, expect, it, vi } from "vitest";

const mockNormalizeOrderIntent = vi.fn().mockReturnValue({
  coin: "BTC",
  side: "buy",
  size: "0.1",
  type: "market",
  reduceOnly: false,
});

const mockCreateBuilderCodeConfig = vi.fn().mockReturnValue({
  builderAddress: "0x1234567890123456789012345678901234567890",
  maxFeeRate: 50,
});

const mockCreateExecutionIntent = vi.fn().mockReturnValue({
  order: {
    coin: "BTC",
    side: "buy",
    size: "0.1",
    type: "market",
    reduceOnly: false,
  },
  builder: {
    builderAddress: "0x1234567890123456789012345678901234567890",
    maxFeeRate: 50,
  },
  makerPolicy: { postOnly: true, priceReference: "mid", spreadBps: 0 },
  fallbackPolicy: { enabled: true, timeoutMs: 10000, slippageBps: 100 },
});

vi.mock("@handlehyp/trading", () => ({
  normalizeOrderIntent: () => mockNormalizeOrderIntent(),
  createBuilderCodeConfig: () => mockCreateBuilderCodeConfig(),
}));

vi.mock("@handlehyp/execution", () => ({
  createExecutionIntent: () => mockCreateExecutionIntent(),
}));

import { executionRoutes } from "./execution.js";

describe("POST /execution", () => {
  it("creates an execution intent", async () => {
    const app = Fastify();

    await app.register(executionRoutes);

    const response = await app.inject({
      method: "POST",
      url: "/execution",
      payload: {
        coin: "BTC",
        side: "buy",
        size: "0.1",
        type: "market",
        builderAddress: "0x1234567890123456789012345678901234567890",
        maxFeeRate: 50,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().order.coin).toBe("BTC");
    expect(response.json().makerPolicy.postOnly).toBe(true);

    await app.close();
  });

  it("validates builder address", async () => {
    mockCreateBuilderCodeConfig.mockImplementationOnce(() => {
      throw new Error("Invalid builder address");
    });

    const app = Fastify();

    await app.register(executionRoutes);

    const response = await app.inject({
      method: "POST",
      url: "/execution",
      payload: {
        coin: "BTC",
        side: "buy",
        size: "0.1",
        type: "market",
        builderAddress: "invalid",
        maxFeeRate: 50,
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: "EXECUTION_ERROR",
      message: "Invalid builder address",
    });

    await app.close();
    mockCreateBuilderCodeConfig.mockClear();
  });
});
