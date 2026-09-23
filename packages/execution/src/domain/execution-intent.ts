import type {
  BuilderCodeConfig,
  NormalizedOrderIntent,
} from "@handlehyp/trading";
import type { MakerPolicy } from "./maker-policy.js";
import type { FallbackPolicy } from "./fallback-policy.js";

export interface ExecutionIntent {
  order: NormalizedOrderIntent;
  builder: BuilderCodeConfig;
  makerPolicy: MakerPolicy;
  fallbackPolicy: FallbackPolicy;
}

export interface ExecutionIntentOptions {
  order: NormalizedOrderIntent;
  builder: BuilderCodeConfig;
  makerPolicy?: MakerPolicy;
  fallbackPolicy?: FallbackPolicy;
}

export function createExecutionIntent(
  options: ExecutionIntentOptions,
): ExecutionIntent {
  return {
    order: options.order,
    builder: options.builder,
    makerPolicy:
      options.makerPolicy ?? defaultMakerPolicy(),
    fallbackPolicy:
      options.fallbackPolicy ?? defaultFallbackPolicy(),
  };
}

function defaultMakerPolicy(): MakerPolicy {
  return {
    postOnly: true,
    spreadBps: 0,
    priceReference: "mid",
  };
}

function defaultFallbackPolicy(): FallbackPolicy {
  return {
    enabled: true,
    timeoutMs: 10_000,
    slippageBps: 100,
  };
}
