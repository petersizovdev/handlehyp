import type { ExchangeResponse } from "../types/exchange.js";

export interface ExchangeExecutionPort {
  execute(
    action: unknown,
    nonce: number,
  ): Promise<ExchangeResponse>;
}
