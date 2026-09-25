import type {
  Strategy,
  StrategyMarketData,
  SignalCandidate,
  SignalEvidenceItem,
} from "../domain/strategy.js";

export interface OIAnomalyConfig {
  minOiChangeBps?: number;
  maxPriceChangeBps?: number;
  minConfidence?: number;
}

export class OIAnomalyStrategy implements Strategy {
  readonly id = "oi-anomaly";
  readonly name = "OI Anomaly";
  readonly description =
    "Detects abnormal Open Interest changes relative to price movement";
  readonly side = "buy" as const;

  private readonly minOiChangeBps: number;
  private readonly maxPriceChangeBps: number;
  private readonly minConfidence: number;

  constructor(
    config: OIAnomalyConfig = {},
  ) {
    this.minOiChangeBps =
      config.minOiChangeBps ?? 500;
    this.maxPriceChangeBps =
      config.maxPriceChangeBps ?? 50;
    this.minConfidence =
      config.minConfidence ?? 60;
  }

  evaluate(
    input: StrategyMarketData,
  ): SignalCandidate | null {
    if (
      input.openInterest === "0" ||
      input.previousOpenInterest ===
        "0"
    ) {
      return null;
    }

    const oiChangeBps = percentChangeBps(
      input.previousOpenInterest,
      input.openInterest,
    );

    const priceChangeBps = percentChangeBps(
      input.previousPrice,
      input.price,
    );

    const priceChangeAbs =
      Math.abs(priceChangeBps);

    if (
      Math.abs(oiChangeBps) <
        this.minOiChangeBps ||
      priceChangeAbs >
        this.maxPriceChangeBps
    ) {
      return null;
    }

    const side =
      oiChangeBps > 0
        ? "buy"
        : "sell";

    const confidence = Math.min(
      Math.round(
        50 +
          (Math.abs(oiChangeBps) -
            this.minOiChangeBps) /
            100 *
          50,
      ),
      100,
    );

    if (
      confidence < this.minConfidence
    ) {
      return null;
    }

    const evidence: SignalEvidenceItem[] = [
      {
        metric: "openInterest",
        value: input.openInterest,
        threshold: String(
          this.minOiChangeBps,
        ),
        direction:
          oiChangeBps > 0
            ? "above"
            : "below",
        description:
          `OI changed ${formatBps(oiChangeBps)}`,
      },
      {
        metric: "price",
        value: input.price,
        threshold: String(
          this.maxPriceChangeBps,
        ),
        direction: "below",
        description:
          `Price changed only ${formatBps(priceChangeBps)}`,
      },
    ];

    return {
      strategyId: this.id,
      name: this.name,
      coin: input.coin,
      side,
      confidence,
      evidence,
      entryPrice: input.price,
      metadata: {
        oiChangeBps: String(oiChangeBps),
        priceChangeBps:
          String(priceChangeBps),
      },
    };
  }
}

function percentChangeBps(
  from: string,
  to: string,
): number {
  const fromVal = Number(from);
  const toVal = Number(to);

  if (fromVal === 0) {
    return toVal > 0 ? 100_000 : 0;
  }

  return (
    (toVal - fromVal) /
    fromVal *
    10_000
  );
}

function formatBps(
  bps: number,
): string {
  if (bps >= 0) {
    return `+${bps} bps`;
  }
  return `${bps} bps`;
}
