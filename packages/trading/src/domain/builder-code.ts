import type { NormalizedOrderIntent } from "./types.js";

const WALLET_ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;

export interface BuilderCodeConfig {
  builderAddress: string;
  maxFeeRate: number;
}

export interface OrderExecutionRequest {
  order: NormalizedOrderIntent;
  builder: BuilderCodeConfig;
}

export function createBuilderCodeConfig(
  builderAddress: string,
  maxFeeRate: number,
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

  return {
    order,
    builder,
  };
}
