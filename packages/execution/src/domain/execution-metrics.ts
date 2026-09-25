import type {
  ExecutionMetrics,
  ExecutionResult,
} from "./execution-types.js";
import type { ExecutionIntent } from "./execution-intent.js";

export function computeExecutionMetrics(
  result: ExecutionResult,
  intent: ExecutionIntent,
): ExecutionMetrics {
  const orderSize = intent.order.size;
  const totalFilled = result.totalFilled;
  const averagePrice =
    result.fills.length > 0
      ? computeAveragePrice(result.fills)
      : result.averagePrice;

  const estimatedSavingsBps = estimateSavingsBps(
    result,
    intent,
  );

  return {
    orderSize,
    totalFilled,
    averagePrice,
    executionType: result.executionType,
    estimatedSavingsBps,
    builderFeeApplied: intent.builder !== undefined,
    makerRebateEarned:
      result.executionType === "maker",
  };
}

function computeAveragePrice(
  fills: NonNullable<ExecutionResult["fills"]>,
): string {
  if (fills.length === 0) {
    return "0";
  }

  let totalValue = 0;
  let totalSize = 0;

  for (const fill of fills) {
    totalValue += Number(fill.price) * Number(fill.size);
    totalSize += Number(fill.size);
  }

  if (totalSize === 0) {
    return "0";
  }

  return formatPrice(totalValue / totalSize);
}

function estimateSavingsBps(
  result: ExecutionResult,
  intent: ExecutionIntent,
): number {
  if (
    result.executionType ===
    "taker"
  ) {
    return 0;
  }

  if (intent.order.size === "0") {
    return 0;
  }

  const orderSize = Number(intent.order.size);
  const avgFillPrice =
    result.fills.length > 0
      ? Number(computeAveragePrice(result.fills))
      : 0;

  if (avgFillPrice === 0 || orderSize === 0) {
    return 0;
  }

  return 0;
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
