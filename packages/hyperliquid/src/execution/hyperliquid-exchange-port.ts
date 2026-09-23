import type { ExchangeResponse } from "../types/exchange.js";
import type { ExchangeExecutionPort } from "./exchange-execution-port.js";
import { HyperliquidExchangeExecutor } from "../client/exchange-executor.js";

export class HyperliquidExchangeExecutionPort
  implements ExchangeExecutionPort
{
  private readonly executor: HyperliquidExchangeExecutor;

  constructor(executor: HyperliquidExchangeExecutor) {
    this.executor = executor;
  }

  execute(
    action: unknown,
    nonce: number,
  ): Promise<ExchangeResponse> {
    return this.executor.execute(action, nonce);
  }
}
