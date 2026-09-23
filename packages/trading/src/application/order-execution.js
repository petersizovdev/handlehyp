import { normalizeOrderIntent } from "../domain/validation.js";
export class TradingOrderService {
    executor;
    constructor(executor) {
        this.executor = executor;
    }
    async execute(intent) {
        const normalized = normalizeOrderIntent(intent);
        return this.executor.executeOrder(normalized);
    }
}
//# sourceMappingURL=order-execution.js.map