export const STRATEGIES_PACKAGE = "@handlehyp/strategies";

export { StrategyEngine } from "./engine/strategy-engine.js";
export type { StrategyEngineOptions } from "./engine/strategy-engine.js";

export {
  OIAnomalyStrategy,
  VolumeSpikeStrategy,
  FundingExtremeStrategy,
  WhaleAccumulationStrategy,
  LiquidationCascadeStrategy,
} from "./strategies/index.js";
export type {
  OIAnomalyConfig,
  VolumeSpikeConfig,
  FundingExtremeConfig,
  WhaleAccumulationConfig,
  LiquidationCascadeConfig,
} from "./strategies/index.js";

export type {
  Strategy,
  StrategyMarketData,
  SignalCandidate,
  SignalEvidenceItem,
} from "./domain/strategy.js";

export type {
  Signal,
  SignalStatus,
  SignalSide,
  SignalOutcome,
  SignalEvidence,
  SignalResolution,
} from "./domain/signal.js";

export type {
  SignalStore,
  SignalStoreOptions,
} from "./domain/signal-store.js";

export {
  generateSignalId,
} from "./domain/signal-id.js";
