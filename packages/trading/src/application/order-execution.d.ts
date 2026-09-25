import type { NormalizedOrderIntent, OrderIntent } from "../domain/types.js";
export interface OrderExecutionPort {
    executeOrder(order: NormalizedOrderIntent): Promise<unknown>;
}
export declare class TradingOrderService {
    private readonly executor;
    constructor(executor: OrderExecutionPort);
    execute(intent: OrderIntent): Promise<unknown>;
}
//# sourceMappingURL=order-execution.d.ts.map