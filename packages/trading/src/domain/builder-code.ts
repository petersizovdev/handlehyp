import type { NormalizedOrderIntent } from "./types.js";

const WALLET_ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;

export interface BuilderFeeTier {
  minVolume30d: number;
  maxFeeRate: number;
}

export interface BuilderConfigStore {
  getBuilderConfig(
    walletAddress: string,
  ): Promise<BuilderCodeConfig | undefined>;
}

export interface BuilderApprovalState {
  user: string;
  builder: string;
  maxFeeRate: number;
  approvedAt: number;
}

export interface BuilderCodeConfig {
  builderAddress: string;
  maxFeeRate: number;
  feeTier?: string;
  approvedAt?: number;
}

export interface OrderExecutionRequest {
  order: NormalizedOrderIntent;
  builder: BuilderCodeConfig;
}

export function createBuilderCodeConfig(
  builderAddress: string,
  maxFeeRate: number,
  feeTier?: string,
): BuilderCodeConfig {
  const normalizedAddress = builderAddress.trim();

  if (!WALLET_ADDRESS_PATTERN.test(normalizedAddress)) {
    throw new Error("Invalid builder address");
  }

  if (
    !Number.isInteger(maxFeeRate) ||
    maxFeeRate <= 0 ||
    maxFeeRate > 100
  ) {
    throw new Error(
      "Invalid builder fee rate: expected integer from 1 to 100 decibps",
    );
  }

  return {
    builderAddress: normalizedAddress,
    maxFeeRate,
    ...(feeTier !== undefined ? { feeTier } : {}),
  };
}

export function createOrderExecutionRequest(
  order: NormalizedOrderIntent,
  builder: BuilderCodeConfig,
): OrderExecutionRequest {
  if (!WALLET_ADDRESS_PATTERN.test(builder.builderAddress)) {
    throw new Error("Invalid builder address");
  }

  if (
    !Number.isInteger(builder.maxFeeRate) ||
    builder.maxFeeRate <= 0 ||
    builder.maxFeeRate > 100
  ) {
    throw new Error("Invalid builder fee rate");
  }

  if (builder.approvedAt === undefined) {
    throw new Error(
      "Builder fee is not approved for this account",
    );
  }

  return {
    order,
    builder,
  };
}

export function assertServerSideInjection(
  builder: BuilderCodeConfig,
  source: "server" | "client",
): void {
  if (source === "client") {
    throw new Error(
      "Builder configuration must be injected server-side only",
    );
  }
  if (!builder.approvedAt) {
    throw new Error(
      "Builder fee approval missing — server-side validation failed",
    );
  }
}
