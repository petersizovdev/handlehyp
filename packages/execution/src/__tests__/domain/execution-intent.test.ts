import { describe, expect, it } from "vitest";
import { createExecutionIntent } from "../../domain/execution-intent.js";
import { createMakerPolicy } from "../../domain/maker-policy.js";
import { createFallbackPolicy } from "../../domain/fallback-policy.js";
import { computeExecutionMetrics } from "../../domain/execution-metrics.js";
import type {
  ExecutionResult,
  Fill,
} from "../../domain/execution-types.js";
import type { NormalizedOrderIntent } from "@handlehyp/trading";

function createOrder(
  overrides: Partial<NormalizedOrderIntent> = {},
): NormalizedOrderIntent {
  return {
    account: {
      telegramUserId: 1,
      walletAddress:
        "0x14791697260E4c9A71f18484C9f997B308e59325",
    },
    coin: "BTC",
    side: "buy",
    type: "limit",
    size: "0.01",
    limitPrice: "60000",
    reduceOnly: false,
    ...overrides,
  };
}

describe("createExecutionIntent", () => {
  it("applies default maker and fallback policies", () => {
    const intent = createExecutionIntent({
      order: createOrder(),
      builder: {
        builderAddress:
          "0x14791697260E4c9A71f18484C9f997B308e59325",
        maxFeeRate: 10,
      },
    });

    expect(intent.makerPolicy).toEqual({
      postOnly: true,
      priceReference: "mid",
      spreadBps: 0,
    });

    expect(intent.fallbackPolicy).toEqual({
      enabled: true,
      timeoutMs: 10_000,
      slippageBps: 100,
    });
  });

  it("accepts custom maker and fallback policies", () => {
    const intent = createExecutionIntent({
      order: createOrder(),
      builder: {
        builderAddress:
          "0x14791697260E4c9A71f18484C9f997B308e59325",
        maxFeeRate: 10,
      },
      makerPolicy: createMakerPolicy({
        spreadBps: 50,
      }),
      fallbackPolicy: createFallbackPolicy({
        timeoutMs: 5_000,
      }),
    });

    expect(intent.makerPolicy.spreadBps).toBe(50);
    expect(intent.fallbackPolicy.timeoutMs).toBe(5_000);
  });

  it("includes the order and builder config", () => {
    const order = createOrder();
    const builder = {
      builderAddress:
        "0x14791697260E4c9A71f18484C9f997B308e59325",
      maxFeeRate: 10,
    };

    const intent = createExecutionIntent({
      order,
      builder,
    });

    expect(intent.order).toBe(order);
    expect(intent.builder).toBe(builder);
  });
});

describe("computeExecutionMetrics", () => {
  const intent = createExecutionIntent({
    order: createOrder(),
    builder: {
      builderAddress:
        "0x14791697260E4c9A71f18484C9f997B308e59325",
      maxFeeRate: 10,
    },
  });

  function makeResult(
    overrides: Partial<ExecutionResult> = {},
  ): ExecutionResult {
    return {
      orderId: "order-1",
      executionType: "maker",
      totalFilled: "0.01",
      fills: [{ orderId: "order-1", price: "59990", size: "0.01" }],
      averagePrice: "59990",
      state: "filled_maker",
      ...overrides,
    };
  }

  it("reports maker execution type", () => {
    const result = makeResult({
      executionType: "maker",
    });

    const metrics = computeExecutionMetrics(result, intent);

    expect(metrics.executionType).toBe("maker");
    expect(metrics.makerRebateEarned).toBe(true);
  });

  it("reports taker execution type", () => {
    const result = makeResult({
      executionType: "taker",
      state: "filled_taker",
    });

    const metrics = computeExecutionMetrics(result, intent);

    expect(metrics.executionType).toBe("taker");
    expect(metrics.makerRebateEarned).toBe(false);
  });

  it("reports builder fee applied when builder config present", () => {
    const result = makeResult();

    const metrics = computeExecutionMetrics(result, intent);

    expect(metrics.builderFeeApplied).toBe(true);
  });

  it("computes average price from fills", () => {
    const fills: Fill[] = [
      { orderId: "1", price: "59990", size: "0.005" },
      { orderId: "1", price: "60000", size: "0.005" },
    ];

    const result = makeResult({
      fills,
      totalFilled: "0.01",
    });

    const metrics = computeExecutionMetrics(result, intent);

    expect(metrics.averagePrice).toBe("59995");
  });

  it("carries through order size and total filled", () => {
    const result = makeResult({
      totalFilled: "0.007",
    });

    const metrics = computeExecutionMetrics(result, intent);

    expect(metrics.orderSize).toBe("0.01");
    expect(metrics.totalFilled).toBe("0.007");
  });
});
