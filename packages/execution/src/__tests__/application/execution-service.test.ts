import { describe, expect, it, vi } from "vitest";
import { ExecutionService } from "../../application/execution-service.js";
import { createExecutionIntent } from "../../domain/execution-intent.js";
import type {
  ExecutionContext,
  ExecutionExchangePort,
  OrderStatus,
} from "../../application/ports.js";
import type {
  MarketSnapshot,
} from "../../domain/execution-types.js";
import type { MakerPolicy } from "../../domain/maker-policy.js";
import type { FallbackPolicy } from "../../domain/fallback-policy.js";
import type {
  NormalizedOrderIntent,
} from "@handlehyp/trading";
import type { BuilderCodeConfig } from "@handlehyp/trading";

type MockCtx = ExecutionContext & {
  exchange: ExecutionExchangePort & {
    submitMakerOrder: ReturnType<typeof vi.fn>;
    submitTakerOrder: ReturnType<typeof vi.fn>;
    cancelOrder: ReturnType<typeof vi.fn>;
    replaceOrder: ReturnType<typeof vi.fn>;
    getOrderStatus: ReturnType<typeof vi.fn>;
  };
  marketData: {
    getMarketSnapshot: ReturnType<typeof vi.fn>;
  };
  clock: {
    now: ReturnType<typeof vi.fn>;
  };
  poll: ReturnType<typeof vi.fn>;
};

function createMarket(
  overrides: Partial<MarketSnapshot> = {},
): MarketSnapshot {
  return {
    midPrice: "60000",
    bestBid: "59990",
    bestAsk: "60010",
    bidLevels: [
      { price: "59990", size: "1" },
    ],
    askLevels: [
      { price: "60010", size: "1" },
    ],
    ...overrides,
  };
}

function status(
  state: OrderStatus["state"],
  filled: string,
  fills: OrderStatus["fills"] = [],
): OrderStatus {
  return {
    orderId: "order-1",
    state,
    filled,
    remaining: "0",
    fills,
  };
}

function createContext(
  overrides: Partial<MockCtx> = {},
): MockCtx {
  return {
    exchange: {
      submitMakerOrder: vi.fn(),
      submitTakerOrder: vi.fn(),
      cancelOrder: vi.fn(),
      replaceOrder: vi.fn(),
      getOrderStatus: vi.fn(),
    },
    marketData: {
      getMarketSnapshot: vi
        .fn()
        .mockResolvedValue(createMarket()),
    },
    clock: {
      now: vi.fn().mockReturnValue(0),
    },
    pollIntervalMs: 200,
    poll: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function createIntent(
  overrides: {
    order?: Partial<NormalizedOrderIntent>;
    builder?: BuilderCodeConfig;
    makerPolicy?: MakerPolicy;
    fallbackPolicy?: FallbackPolicy;
  } = {},
): ReturnType<typeof createExecutionIntent> {
  const order: NormalizedOrderIntent = {
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
  };

  return createExecutionIntent({
    order: { ...order, ...(overrides.order ?? {}) },
    builder: overrides.builder ?? {
      builderAddress:
        "0x14791697260E4c9A71f18484C9f997B308e59325",
      maxFeeRate: 10,
    },
    ...(overrides.makerPolicy
      ? { makerPolicy: overrides.makerPolicy }
      : {}),
    ...(overrides.fallbackPolicy
      ? { fallbackPolicy: overrides.fallbackPolicy }
      : {}),
  });
}

function withTimeoutPoll(
  ctx: MockCtx,
  tickMs: number = 200,
) {
  ctx.poll.mockImplementation(async () => {
    ctx.clock.now.mockReturnValue(
      ctx.clock.now() + tickMs,
    );
  });
}

describe("ExecutionService", () => {
  it("executes maker order that fills immediately", async () => {
    const ctx = createContext();

    ctx.exchange.submitMakerOrder.mockResolvedValue(
      "maker-1",
    );
    ctx.exchange.getOrderStatus.mockResolvedValue(
      status("filled", "0.01", [
        {
          orderId: "maker-1",
          price: "59990",
          size: "0.01",
        },
      ]),
    );

    const service = new ExecutionService(ctx);
    const result = await service.execute(
      createIntent(),
    );

    expect(
      ctx.exchange.submitMakerOrder,
    ).toHaveBeenCalledTimes(1);
    expect(
      ctx.exchange.getOrderStatus,
    ).toHaveBeenCalledTimes(1);
    expect(
      ctx.exchange.submitTakerOrder,
    ).not.toHaveBeenCalled();

    expect(result).toEqual({
      orderId: "maker-1",
      executionType: "maker",
      totalFilled: "0.01",
      fills: [
        {
          orderId: "maker-1",
          price: "59990",
          size: "0.01",
        },
      ],
      averagePrice: "59990",
      state: "filled_maker",
    });
  });

  it("falls back to taker when maker times out", async () => {
    const ctx = createContext();

    ctx.exchange.submitMakerOrder.mockResolvedValue(
      "maker-1",
    );
    ctx.exchange.submitTakerOrder.mockResolvedValue(
      "taker-1",
    );

    ctx.exchange.getOrderStatus.mockImplementation(
      async (orderId: string) => {
        if (orderId === "maker-1") {
          return status("open", "0");
        }
        return status("filled", "0.01", [
          {
            orderId: "taker-1",
            price: "60050",
            size: "0.01",
          },
        ]);
      },
    );

    const intent = createIntent({
      fallbackPolicy: {
        enabled: true,
        timeoutMs: 1_000,
        slippageBps: 100,
      },
    });

    withTimeoutPoll(ctx);

    const service = new ExecutionService(ctx);
    const result = await service.execute(intent);

    expect(
      ctx.exchange.submitTakerOrder,
    ).toHaveBeenCalledTimes(1);
    expect(
      ctx.exchange.submitTakerOrder,
    ).toHaveBeenCalledWith({
      coin: "BTC",
      side: "buy",
      size: "0.01",
      reduceOnly: false,
      slippageBps: 100,
    });
    expect(result.executionType).toBe("taker");
    expect(result.state).toBe("filled_taker");
    expect(result.totalFilled).toBe("0.01");
    expect(result.orderId).toBe("taker-1");
  });

  it("attempts cancel/replace on partial fill", async () => {
    const ctx = createContext();

    ctx.exchange.submitMakerOrder.mockResolvedValue(
      "maker-1",
    );
    ctx.exchange.replaceOrder.mockResolvedValue(
      "maker-2",
    );

    ctx.exchange.getOrderStatus.mockImplementation(
      async (orderId: string) => {
        if (orderId === "maker-1") {
          return status("partially_filled", "0.005", [
            {
              orderId: "maker-1",
              price: "59990",
              size: "0.005",
            },
          ]);
        }
        return status("filled", "0.005", [
          {
            orderId: "maker-2",
            price: "59990",
            size: "0.005",
          },
        ]);
      },
    );

    const intent = createIntent({
      fallbackPolicy: {
        enabled: true,
        timeoutMs: 1_000,
        slippageBps: 100,
      },
    });

    const service = new ExecutionService(ctx);
    const result = await service.execute(intent);

    expect(
      ctx.exchange.replaceOrder,
    ).toHaveBeenCalledTimes(1);
    expect(
      ctx.exchange.submitTakerOrder,
    ).not.toHaveBeenCalled();
    expect(result.executionType).toBe("maker");
    expect(result.state).toBe("filled_maker");
    expect(result.totalFilled).toBe("0.01");
  });

  it("falls back to taker when cancel/replace also times out", async () => {
    const ctx = createContext();

    ctx.exchange.submitMakerOrder.mockResolvedValue(
      "maker-1",
    );
    ctx.exchange.replaceOrder.mockResolvedValue(
      "maker-2",
    );
    ctx.exchange.submitTakerOrder.mockResolvedValue(
      "taker-1",
    );

    ctx.exchange.getOrderStatus.mockImplementation(
      async (orderId: string) => {
        if (orderId === "maker-1") {
          return status("partially_filled", "0.005", [
            {
              orderId: "maker-1",
              price: "59990",
              size: "0.005",
            },
          ]);
        }
        if (orderId === "maker-2") {
          return status("open", "0");
        }
        return status("filled", "0.005", [
          {
            orderId: "taker-1",
            price: "60050",
            size: "0.005",
          },
        ]);
      },
    );

    const intent = createIntent({
      fallbackPolicy: {
        enabled: true,
        timeoutMs: 1_000,
        slippageBps: 100,
      },
    });

    withTimeoutPoll(ctx);

    const service = new ExecutionService(ctx);
    const result = await service.execute(intent);

    expect(
      ctx.exchange.replaceOrder,
    ).toHaveBeenCalledTimes(1);
    expect(
      ctx.exchange.submitTakerOrder,
    ).toHaveBeenCalledTimes(1);
    expect(result.executionType).toBe("taker");
    expect(result.state).toBe("filled_taker");
    expect(result.totalFilled).toBe("0.01");
  });

  it("does not fall back when fallback is disabled", async () => {
    const ctx = createContext();

    ctx.exchange.submitMakerOrder.mockResolvedValue(
      "maker-1",
    );
    ctx.exchange.getOrderStatus.mockResolvedValue(
      status("open", "0"),
    );

    const intent = createIntent({
      fallbackPolicy: {
        enabled: false,
        timeoutMs: 1_000,
        slippageBps: 100,
      },
    });

    withTimeoutPoll(ctx);

    const service = new ExecutionService(ctx);
    const result = await service.execute(intent);

    expect(
      ctx.exchange.submitTakerOrder,
    ).not.toHaveBeenCalled();
    expect(result.state).toBe("timeout");
    expect(result.executionType).toBe("maker");
  });

  it("never silently classifies a taker result as maker", async () => {
    const ctx = createContext();

    ctx.exchange.submitMakerOrder.mockResolvedValue(
      "maker-1",
    );
    ctx.exchange.submitTakerOrder.mockResolvedValue(
      "taker-1",
    );

    ctx.exchange.getOrderStatus.mockImplementation(
      async (orderId: string) => {
        if (orderId === "taker-1") {
          return status("filled", "0.01", [
            {
              orderId: "taker-1",
              price: "60050",
              size: "0.01",
            },
          ]);
        }
        return status("open", "0");
      },
    );

    const intent = createIntent({
      fallbackPolicy: {
        enabled: true,
        timeoutMs: 1_000,
        slippageBps: 100,
      },
    });

    withTimeoutPoll(ctx);

    const service = new ExecutionService(ctx);
    const result = await service.execute(intent);

    expect(result.executionType).toBe("taker");
  });

  it("classifies immediate fill as maker", async () => {
    const ctx = createContext();

    ctx.exchange.submitMakerOrder.mockResolvedValue(
      "maker-1",
    );
    ctx.exchange.getOrderStatus.mockResolvedValue(
      status("filled", "0.01", [
        {
          orderId: "maker-1",
          price: "59990",
          size: "0.01",
        },
      ]),
    );

    const service = new ExecutionService(ctx);
    const result = await service.execute(
      createIntent(),
    );

    expect(result.executionType).toBe("maker");
    expect(result.state).toBe("filled_maker");
  });
});
