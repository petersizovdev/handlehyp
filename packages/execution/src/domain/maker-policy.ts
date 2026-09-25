export type PriceReference = "mid" | "best_bid_ask";

export interface MakerPolicy {
  postOnly: boolean;
  priceReference: PriceReference;
  spreadBps: number;
}

export function createMakerPolicy(
  options: Partial<MakerPolicy> = {},
): MakerPolicy {
  const policy: MakerPolicy = {
    postOnly: options.postOnly ?? true,
    priceReference: options.priceReference ?? "mid",
    spreadBps: options.spreadBps ?? 0,
  };

  if (
    !Number.isSafeInteger(policy.spreadBps) ||
    policy.spreadBps < 0
  ) {
    throw new Error(
      "Invalid spreadBps: expected a non-negative integer",
    );
  }

  return policy;
}
