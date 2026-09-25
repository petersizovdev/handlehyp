import { getAddress } from "viem";

import type {
  BuildOrderInput,
  HyperliquidBuilder,
  HyperliquidOrderAction,
  HyperliquidOrderWire,
} from "../types/order.js";

const DECIMAL_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d+)?$/;
const CLOID_PATTERN = /^0x[a-fA-F0-9]{32}$/;
const WALLET_ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;

function normalizeDecimal(value: string, field: string): string {
  const normalized = value.trim();

  if (!DECIMAL_PATTERN.test(normalized)) {
    throw new Error(`Invalid ${field}`);
  }

  const parts = normalized.split(".");
  const integerPart = parts[0]!;
  const fractionPart = parts[1];

  const integer = integerPart.replace(/^0+(?=\d)/, "");
  const fraction = fractionPart?.replace(/0+$/, "");

  if (!fraction) {
    return integer;
  }

  return `${integer}.${fraction}`;
}

function validatePositiveDecimal(value: string, field: string): string {
  const normalized = normalizeDecimal(value, field);

  if (normalized === "0") {
    throw new Error(`${field} must be positive`);
  }

  return normalized;
}

function normalizeBuilder(
  builder: HyperliquidBuilder | undefined,
): HyperliquidBuilder | undefined {
  if (!builder) {
    return undefined;
  }

  if (!WALLET_ADDRESS_PATTERN.test(builder.b)) {
    throw new Error("Invalid builder address");
  }

  if (
    !Number.isInteger(builder.f) ||
    builder.f <= 0 ||
    builder.f > 100
  ) {
    throw new Error("Invalid builder fee rate");
  }

  return {
    b: getAddress(builder.b),
    f: builder.f,
  };
}

export function buildHyperliquidOrderAction(
  input: BuildOrderInput,
): HyperliquidOrderAction {
  if (!Number.isSafeInteger(input.asset) || input.asset < 0) {
    throw new Error("Invalid Hyperliquid asset index");
  }

  const size = validatePositiveDecimal(input.size, "order size");
  const price = validatePositiveDecimal(input.price, "order price");

  const tif = input.tif ?? "Gtc";

  if (!["Gtc", "Ioc", "Alo"].includes(tif)) {
    throw new Error("Invalid time in force");
  }

  if (input.cloid !== undefined && !CLOID_PATTERN.test(input.cloid)) {
    throw new Error("Invalid client order id");
  }

  const order: HyperliquidOrderWire = {
    a: input.asset,
    b: input.isBuy,
    p: price,
    s: size,
    r: input.reduceOnly ?? false,
    t: {
      limit: {
        tif,
      },
    },
  };

  if (input.cloid !== undefined) {
    order.c = input.cloid.toLowerCase();
  }

  const builder = normalizeBuilder(input.builder);

  const action: HyperliquidOrderAction = {
    type: "order",
    orders: [order],
    grouping: "na",
  };

  if (builder !== undefined) {
    action.builder = builder;
  }

  return action;
}
