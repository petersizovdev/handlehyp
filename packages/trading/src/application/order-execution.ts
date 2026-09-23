import type {
  NormalizedOrderIntent,
  OrderIntent,
} from "../domain/types.js";
import { normalizeOrderIntent } from "../domain/validation.js";

export interface OrderExecutionPort {
  executeOrder(
    order: NormalizedOrderIntent,
  ): Promise<unknown>;
}

export class TradingOrderService {
  private readonly executor: OrderExecutionPort;

  constructor(executor: OrderExecutionPort) {
    this.executor = executor;
  }

  async execute(intent: OrderIntent): Promise<unknown> {
    const normalized = normalizeOrderIntent(intent);

    return this.executor.executeOrder(normalized);
  }
}
