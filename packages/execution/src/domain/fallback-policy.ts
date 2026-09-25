export interface FallbackPolicy {
  enabled: boolean;
  timeoutMs: number;
  slippageBps: number;
}

export function createFallbackPolicy(
  options: Partial<FallbackPolicy> = {},
): FallbackPolicy {
  const policy: FallbackPolicy = {
    enabled: options.enabled ?? true,
    timeoutMs: options.timeoutMs ?? 10_000,
    slippageBps: options.slippageBps ?? 100,
  };

  if (
    !Number.isSafeInteger(policy.timeoutMs) ||
    policy.timeoutMs <= 0
  ) {
    throw new Error(
      "Invalid timeoutMs: expected a positive integer",
    );
  }

  if (
    !Number.isSafeInteger(policy.slippageBps) ||
    policy.slippageBps < 0
  ) {
    throw new Error(
      "Invalid slippageBps: expected a non-negative integer",
    );
  }

  return policy;
}
