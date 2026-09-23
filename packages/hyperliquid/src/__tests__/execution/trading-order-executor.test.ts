import { describe, expect, it, vi } from "vitest";
import { HyperliquidMarketRegistry } from "../../client/market-registry.js";
import { HyperliquidTradingOrderAdapter } from "../../client/trading-order-adapter.js";
import { HyperliquidTradingOrderExecutor } from "../../execution/trading-order-executor.js";
import type { ExchangeExecutionPort } from "../../execution/exchange-execution-port.js";
import type { NonceProvider } from "../../execution/nonce-provider.js";
import type { HyperliquidPerpetualMarket } from "../../types/market.js";
import type { NormalizedOrderIntent } from "@handlehyp/trading";
import type { HyperliquidTradingOrder } from "../../types/trading-adapter.js";

function createMarket(): HyperliquidPerpetualMarket {
  return {
    assetIndex: 0,
    coin: "BTC",
    symbol: "BTC-PERP",
    szDecimals: 5,
    maxLeverage: 50,
    marginTableId: 0,
    isDelisted: false,
    fundingRate: "0",
    openInterest: "0",
    previousDayPrice: "0",
    dailyNotionalVolume: "0",
    oraclePrice: "0",
    markPrice: "0",
    midPrice: null,
    premium: null,
  };
}

function createAdapter(): HyperliquidTradingOrderAdapter {
  return new HyperliquidTradingOrderAdapter({
    marketRegistry: new HyperliquidMarketRegistry([createMarket()]),
  });
}

function createOrder(
  overrides: Partial<HyperliquidTradingOrder> = {},
): HyperliquidTradingOrder & Pick<NormalizedOrderIntent, "account"> {
  return {
    account: {} as NormalizedOrderIntent["account"],
    coin: "BTC",
    side: "buy",
    type: "limit",
    size: "0.01",
    limitPrice: "60000",
    reduceOnly: false,
    ...overrides,
  };
}

function createExchange(): ExchangeExecutionPort & {
  execute: ReturnType<typeof vi.fn>;
} {
  return {
    execute: vi.fn().mockResolvedValue({
      status: "ok",
    }),
  };
}

function createNonceProvider(): NonceProvider & {
  next: ReturnType<typeof vi.fn>;
} {
  return {
    next: vi.fn().mockReturnValue(123456789),
  };
}

describe("HyperliquidTradingOrderExecutor", () => {
  it("builds exact action and sends it with a generated nonce", async () => {
    const exchange = createExchange();
    const nonceProvider = createNonceProvider();

    const executor = new HyperliquidTradingOrderExecutor({
      orderAdapter: createAdapter(),
      exchange,
      nonceProvider,
    });

    await executor.executeOrder(createOrder());

    expect(nonceProvider.next).toHaveBeenCalledTimes(1);
    expect(exchange.execute).toHaveBeenCalledTimes(1);
    expect(exchange.execute).toHaveBeenCalledWith(
      {
        type: "order",
        orders: [
          {
            a: 0,
            b: true,
            p: "60000",
            s: "0.01",
            r: false,
            t: {
              limit: {
                tif: "Gtc",
              },
            },
          },
        ],
        grouping: "na",
      },
      123456789,
    );
  });

  it("does not call exchange when order construction fails", async () => {
    const exchange = createExchange();
    const nonceProvider = createNonceProvider();

    const executor = new HyperliquidTradingOrderExecutor({
      orderAdapter: createAdapter(),
      exchange,
      nonceProvider,
    });

    await expect(
      executor.executeOrder(
        createOrder({
          coin: "ETH",
        }),
      ),
    ).rejects.toThrow("Unknown Hyperliquid perpetual market: ETH");

    expect(nonceProvider.next).not.toHaveBeenCalled();
    expect(exchange.execute).not.toHaveBeenCalled();
  });

  it("does not request nonce before successful wire construction", async () => {
    const exchange = createExchange();
    const nonceProvider = createNonceProvider();

    const executor = new HyperliquidTradingOrderExecutor({
      orderAdapter: createAdapter(),
      exchange,
      nonceProvider,
    });

    await expect(
      executor.executeOrder(
        createOrder({
          type: "market",
        }),
      ),
    ).rejects.toThrow(
      "Market orders require a market price/slippage policy before wire construction",
    );

    expect(nonceProvider.next).not.toHaveBeenCalled();
    expect(exchange.execute).not.toHaveBeenCalled();
  });
});
