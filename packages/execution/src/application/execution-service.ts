import type { ExecutionIntent } from "../domain/execution-intent.js";
import type {
  ExecutionResult,
  Fill,
  MarketSnapshot,
} from "../domain/execution-types.js";
import { selectMakerPrice } from "../domain/price-selection.js";
import { ExecutionStateMachine } from "../domain/execution-state-machine.js";
import type {
  ExecutionContext,
  MakerOrderRequest,
  TakerOrderRequest,
} from "./ports.js";

export class ExecutionService {
  constructor(
    private readonly context: ExecutionContext,
  ) {}

  async execute(
    intent: ExecutionIntent,
  ): Promise<ExecutionResult> {
    const sm = new ExecutionStateMachine("pending");
    const coin = intent.order.coin;
    const side = intent.order.side;
    const size = intent.order.size;
    const reduceOnly = intent.order.reduceOnly;

    sm.transition("attempt_maker");

    const market =
      await this.context.marketData.getMarketSnapshot(coin);

    const makerPrice = selectMakerPrice(
      side,
      market,
      intent.makerPolicy,
    );

    const makerOrder: MakerOrderRequest = {
      coin,
      side,
      size,
      price: makerPrice,
      reduceOnly,
      postOnly:
        intent.makerPolicy.postOnly,
    };

    const orderId =
      await this.context.exchange.submitMakerOrder(makerOrder);

    sm.transition("order_accepted");

    let makerResult =
      await this.monitorOrder(orderId, sm, intent);

    if (
      makerResult.state === "filled_maker"
    ) {
      sm.transition("complete");

      return makerResult;
    }

    if (
      makerResult.state === "partially_filled"
    ) {
      sm.transition("attempt_maker");

      const replaced =
        await this.attemptCancelReplace(
          orderId,
          side,
          market,
          intent,
          sm,
        );

      if (replaced.state === "filled_maker") {
        sm.transition("complete");

        return accumulateMakerResults(
          makerResult,
          replaced,
        );
      }

      makerResult = accumulateMakerResults(
        makerResult,
        replaced,
      );
    }

    return this.fallback(
      makerResult,
      sm,
      intent,
      side,
      reduceOnly,
    );
  }

  private async monitorOrder(
    orderId: string,
    sm: ExecutionStateMachine,
    intent: ExecutionIntent,
  ): Promise<ExecutionResult> {
    const timeoutMs =
      intent.fallbackPolicy.timeoutMs;

    const start =
      this.context.clock.now();

    while (true) {
      const status =
        await this.context.exchange.getOrderStatus(
          orderId,
        );

      if (status.state === "filled") {
        sm.transition("fully_filled");

        return {
          orderId,
          executionType: "maker",
          totalFilled: status.filled,
          fills: status.fills,
          averagePrice:
            status.fills.length > 0
              ? averagePrice(status.fills)
              : "0",
          state: "filled_maker",
        };
      }

      if (status.state === "partially_filled") {
        sm.transition("partially_filled");

        return {
          orderId,
          executionType: "maker",
          totalFilled: status.filled,
          fills: status.fills,
          averagePrice:
            status.fills.length > 0
              ? averagePrice(status.fills)
              : "0",
          state: "partially_filled",
        };
      }

      if (status.state === "cancelled") {
        sm.transition("cancel");

        return {
          orderId,
          executionType: "maker",
          totalFilled: status.filled,
          fills: status.fills,
          averagePrice:
            status.fills.length > 0
              ? averagePrice(status.fills)
              : "0",
          state: "cancelled",
        };
      }

      if (
        this.context.clock.now() -
          start >= timeoutMs
      ) {
        sm.transition("timeout");

        return {
          orderId,
          executionType: "maker",
          totalFilled: status.filled,
          fills: status.fills,
          averagePrice:
            status.fills.length > 0
              ? averagePrice(status.fills)
              : "0",
          state: "timeout",
        };
      }

      await this.context.poll(
        this.context.pollIntervalMs,
      );
    }
  }

  private async attemptCancelReplace(
    orderId: string,
    side: "buy" | "sell",
    market: MarketSnapshot,
    intent: ExecutionIntent,
    sm: ExecutionStateMachine,
  ): Promise<ExecutionResult> {
    const newPrice = selectMakerPrice(
      side,
      market,
      intent.makerPolicy,
    );

    const newOrderId =
      await this.context.exchange.replaceOrder(
        orderId,
        newPrice,
      );

    sm.transition("order_accepted");

    return this.monitorOrder(
      newOrderId,
      sm,
      intent,
    );
  }

  private async fallback(
    makerResult: ExecutionResult,
    sm: ExecutionStateMachine,
    intent: ExecutionIntent,
    side: "buy" | "sell",
    reduceOnly: boolean,
  ): Promise<ExecutionResult> {
    if (!intent.fallbackPolicy.enabled) {
      if (sm.current !== "timeout") {
        sm.transition("timeout");
      }
      sm.transition("fail");
      return makerResult;
    }

    if (sm.current !== "timeout") {
      sm.transition("timeout");
    }

    sm.transition("attempt_fallback");

    const takerOrder: TakerOrderRequest = {
      coin: intent.order.coin,
      side,
      size: subtractFilled(
        intent.order.size,
        makerResult.totalFilled,
      ),
      reduceOnly,
      slippageBps:
        intent.fallbackPolicy.slippageBps,
    };

    const takerOrderId =
      await this.context.exchange.submitTakerOrder(
        takerOrder,
      );

    const takerStatus =
      await this.context.exchange.getOrderStatus(
        takerOrderId,
      );

    const allFills = [
      ...makerResult.fills,
      ...takerStatus.fills,
    ];

    const totalFilled = addFilled(
      makerResult.totalFilled,
      takerStatus.filled,
    );

    sm.transition("fallback_filled");
    sm.transition("complete");

    return {
      orderId: takerOrderId,
      executionType: "taker",
      totalFilled,
      fills: allFills,
      averagePrice:
        allFills.length > 0
          ? averagePrice(allFills)
          : "0",
      state: "filled_taker",
    };
  }
}

function accumulateMakerResults(
  original: ExecutionResult,
  next: ExecutionResult,
): ExecutionResult {
  const allFills = [
    ...original.fills,
    ...next.fills,
  ];

  return {
    orderId: next.orderId,
    executionType: "maker",
    totalFilled: addFilled(
      original.totalFilled,
      next.totalFilled,
    ),
    fills: allFills,
    averagePrice:
      allFills.length > 0
        ? averagePrice(allFills)
        : "0",
    state: next.state,
  };
}

function subtractFilled(
  size: string,
  filled: string,
): string {
  const remaining =
    Number(size) - Number(filled);

  if (remaining <= 0) {
    return "0";
  }

  return remaining.toString();
}

function addFilled(
  a: string,
  b: string,
): string {
  return (Number(a) + Number(b)).toString();
}

function averagePrice(
  fills: Fill[],
): string {
  if (fills.length === 0) {
    return "0";
  }

  let totalValue = 0;
  let totalSize = 0;

  for (const fill of fills) {
    totalValue +=
      Number(fill.price) * Number(fill.size);
    totalSize += Number(fill.size);
  }

  if (totalSize === 0) {
    return "0";
  }

  return formatPrice(
    totalValue / totalSize,
  );
}

function formatPrice(
  value: number,
): string {
  const rounded = Math.round(value * 1e8) / 1e8;

  return rounded.toString();
}
