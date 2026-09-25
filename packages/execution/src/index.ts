export const EXECUTION_PACKAGE = "@handlehyp/execution";

export {
  ExecutionStateMachine,
} from "./domain/execution-state-machine.js";

export type {
  ExecutionEvent,
} from "./domain/execution-state-machine.js";

export {
  createExecutionIntent,
} from "./domain/execution-intent.js";

export type {
  ExecutionIntent,
  ExecutionIntentOptions,
} from "./domain/execution-intent.js";

export {
  createMakerPolicy,
} from "./domain/maker-policy.js";

export type {
  MakerPolicy,
  PriceReference,
} from "./domain/maker-policy.js";

export {
  createFallbackPolicy,
} from "./domain/fallback-policy.js";

export type {
  FallbackPolicy,
} from "./domain/fallback-policy.js";

export {
  selectMakerPrice,
} from "./domain/price-selection.js";

export {
  computeExecutionMetrics,
} from "./domain/execution-metrics.js";

export {
  ExecutionService,
} from "./application/execution-service.js";

export type {
  ExecutionContext,
  ExecutionExchangePort,
  MakerOrderRequest,
  MarketDataProvider,
  OrderStatus,
  TakerOrderRequest,
} from "./application/ports.js";

export type {
  ExecutionMetrics,
  ExecutionResult,
  ExecutionState,
  ExecutionType,
  Fill,
  MarketSnapshot,
  OrderId,
  OrderSide,
  PriceLevel,
} from "./domain/execution-types.js";
