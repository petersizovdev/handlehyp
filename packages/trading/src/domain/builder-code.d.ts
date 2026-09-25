import type { NormalizedOrderIntent } from "./types.js";
export interface BuilderCodeConfig {
    builderAddress: string;
    maxFeeRate: number;
}
export interface OrderExecutionRequest {
    order: NormalizedOrderIntent;
    builder: BuilderCodeConfig;
}
export declare function createBuilderCodeConfig(builderAddress: string, maxFeeRate: number): BuilderCodeConfig;
export declare function createOrderExecutionRequest(order: NormalizedOrderIntent, builder: BuilderCodeConfig): OrderExecutionRequest;
//# sourceMappingURL=builder-code.d.ts.map