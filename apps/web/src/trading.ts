import type { TradingAction } from "./types.js";

export function createTradingAction(
  type: "buy" | "sell",
  coin: string,
  size: string,
  signalId?: string,
): TradingAction {
  return {
    type,
    coin,
    size,
    ...(signalId !== undefined && { signalId }),
  };
}

export function validateTradingAction(
  action: TradingAction,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!["buy", "sell"].includes(action.type)) {
    errors.push("Invalid action type");
  }

  if (!action.coin || action.coin.length === 0) {
    errors.push("Coin is required");
  }

  const size = Number(action.size);
  if (!Number.isFinite(size) || size <= 0) {
    errors.push("Size must be a positive number");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
