import type {
  MarketSnapshot,
  OrderSide,
} from "./execution-types.js";
import type { MakerPolicy } from "./maker-policy.js";

export function selectMakerPrice(
  side: OrderSide,
  market: MarketSnapshot,
  policy: MakerPolicy,
): string {
  const reference = policy.priceReference;

  if (reference === "mid") {
    return applySpread(market.midPrice, policy, side);
  }

  if (reference === "best_bid_ask") {
    if (side === "buy") {
      return applySpread(market.bestBid, policy, side);
    }
    return applySpread(market.bestAsk, policy, side);
  }

  throw new Error(
    `Unknown price reference: ${reference}`,
  );
}

function applySpread(
  price: string,
  policy: MakerPolicy,
  side: OrderSide,
): string {
  if (policy.spreadBps === 0) {
    return price;
  }

  const value = Number(price);
  const factor =
    side === "buy"
      ? 1 - policy.spreadBps / 10_000
      : 1 + policy.spreadBps / 10_000;

  const adjusted = value * factor;

  return formatPrice(adjusted);
}

function formatPrice(
  value: number,
): string {
  if (!Number.isFinite(value)) {
    throw new Error("Invalid price: not a finite number");
  }

  const rounded = Math.round(value * 1e8) / 1e8;

  return rounded.toString();
}
