import type { HyperliquidPerpetualMarket } from "../types/market.js";

export interface MarketOrderPolicyOptions {
  slippageBps: number;
  referencePrice: string;
}

function assertDecimal(value: string, name: string): void {
  if (!/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value)) {
    throw new Error(`${name} must be a positive decimal string`);
  }
}

function parseDecimal(value: string): {
  raw: bigint;
  scale: number;
} {
  const [integer = "0", fraction = ""] = value.split(".");

  return {
    raw: BigInt(`${integer}${fraction}`),
    scale: fraction.length,
  };
}

function formatDecimal(raw: bigint, scale: number): string {
  if (raw === 0n) {
    return "0";
  }

  const negative = raw < 0n;
  const absolute = negative ? -raw : raw;
  const digits = absolute.toString();

  if (scale === 0) {
    return `${negative ? "-" : ""}${digits}`;
  }

  const padded = digits.padStart(scale + 1, "0");
  const integer = padded.slice(0, -scale);
  const fraction = padded.slice(-scale).replace(/0+$/, "");

  return `${negative ? "-" : ""}${integer}${
    fraction.length > 0 ? `.${fraction}` : ""
  }`;
}

function scaleTo(value: bigint, fromScale: number, toScale: number): bigint {
  if (fromScale === toScale) {
    return value;
  }

  if (fromScale < toScale) {
    return value * 10n ** BigInt(toScale - fromScale);
  }

  return value / 10n ** BigInt(fromScale - toScale);
}

function addDecimals(left: string, right: string): string {
  const a = parseDecimal(left);
  const b = parseDecimal(right);
  const scale = Math.max(a.scale, b.scale);

  return formatDecimal(
    scaleTo(a.raw, a.scale, scale) +
      scaleTo(b.raw, b.scale, scale),
    scale,
  );
}

function subtractDecimals(left: string, right: string): string {
  const a = parseDecimal(left);
  const b = parseDecimal(right);
  const scale = Math.max(a.scale, b.scale);

  const result =
    scaleTo(a.raw, a.scale, scale) -
    scaleTo(b.raw, b.scale, scale);

  if (result <= 0n) {
    throw new Error("Market order slippage produced a non-positive price");
  }

  return formatDecimal(result, scale);
}

function multiplyByBps(value: string, bps: number): string {
  const parsed = parseDecimal(value);
  const numerator = parsed.raw * BigInt(bps);
  const denominator = 10_000n;

  const quotient = numerator / denominator;
  const remainder = numerator % denominator;

  if (remainder === 0n) {
    return formatDecimal(quotient, parsed.scale);
  }

  const extraScale = 8;
  const scaled = numerator * 10n ** BigInt(extraScale);
  const precise = scaled / denominator;

  return formatDecimal(
    precise,
    parsed.scale + extraScale,
  );
}

function roundToHyperliquidPrice(
  price: string,
  market: HyperliquidPerpetualMarket,
): string {
  const parsed = parseDecimal(price);

  if (parsed.raw <= 0n) {
    throw new Error("Market order price must be greater than zero");
  }

  const integerPart = parsed.raw / 10n ** BigInt(parsed.scale);
  const integerDigits = integerPart.toString().length;

  const maxSignificantDigits = 5;
  const maxDecimals = Math.max(
    0,
    6 - market.szDecimals,
  );

  const decimalPlaces = Math.max(
    0,
    Math.min(
      maxSignificantDigits - integerDigits,
      maxDecimals,
    ),
  );

  if (decimalPlaces >= parsed.scale) {
    return formatDecimal(parsed.raw, parsed.scale);
  }

  const divisor =
    10n ** BigInt(parsed.scale - decimalPlaces);

  let rounded = parsed.raw / divisor;
  const remainder = parsed.raw % divisor;

  if (remainder * 2n >= divisor) {
    rounded += 1n;
  }

  return formatDecimal(rounded, decimalPlaces);
}

export function buildMarketOrderPrice(
  market: HyperliquidPerpetualMarket,
  isBuy: boolean,
  options: MarketOrderPolicyOptions,
): string {
  if (!Number.isInteger(options.slippageBps)) {
    throw new Error("Market order slippageBps must be an integer");
  }

  if (options.slippageBps <= 0 || options.slippageBps > 5_000) {
    throw new Error(
      "Market order slippageBps must be between 1 and 5000",
    );
  }

  assertDecimal(
    options.referencePrice,
    "Market order referencePrice",
  );

  if (options.referencePrice === "0") {
    throw new Error(
      "Market order referencePrice must be greater than zero",
    );
  }

  const adjustment = multiplyByBps(
    options.referencePrice,
    options.slippageBps,
  );

  const aggressivePrice = isBuy
    ? addDecimals(options.referencePrice, adjustment)
    : subtractDecimals(options.referencePrice, adjustment);

  return roundToHyperliquidPrice(
    aggressivePrice,
    market,
  );
}
