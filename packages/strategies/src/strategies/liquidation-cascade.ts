import type {
  Strategy,
  StrategyMarketData,
  SignalCandidate,
  SignalEvidenceItem,
} from "../domain/strategy.js";

export interface LiquidationCascadeConfig {
  minPriceChangeBps?: number;
  minVolumeChangeBps?: number;
  minConfidence?: number;
}

export class LiquidationCascadeStrategy implements Strategy {
  readonly id = "liquidation-cascade";
  readonly name = "Liquidation Cascade";
  readonly description =
    "Detect conditions associated with liquidation activity";
  readonly side = "sell" as const;

  private readonly minPriceChangeBps: number;
  private readonly minVolumeChangeBps: number;
  private readonly minConfidence: number;

  constructor(
    config: LiquidationCascadeConfig = {},
  ) {
    this.minPriceChangeBps =
      config.minPriceChangeBps ?? 200;
    this.minVolumeChangeBps =
      config.minVolumeChangeBps ?? 1000;
    this.minConfidence =
      config.minConfidence ?? 55;
  }

  evaluate(
    input: StrategyMarketData,
  ): SignalCandidate | null {
    if (
      input.volume === "0" ||
      input.previousVolume === "0" ||
      input.price === "0" ||
      input.previousPrice === "0"
    ) {
      return null;
    }

    const priceChangeBps = percentChangeBps(
      input.previousPrice,
      input.price,
    );

    const volumeChangeBps = percentChangeBps(
      input.previousVolume,
      input.volume,
    );

    const priceChangeAbs = Math.abs(priceChangeBps);

    if (priceChangeAbs < this.minPriceChangeBps) {
      return null;
    }

    if (volumeChangeBps < this.minVolumeChangeBps) {
      return null;
    }

    const side = priceChangeBps < 0 ? "sell" : "buy";

    const confidence = Math.min(
      Math.round(
        50 +
          (priceChangeAbs - this.minPriceChangeBps) /
            500 *
            50,
      ),
      100,
    );

    if (confidence < this.minConfidence) {
      return null;
    }

    const evidence: SignalEvidenceItem[] = [
      {
        metric: "price",
        value: input.price,
        threshold: String(this.minPriceChangeBps),
        direction: priceChangeBps < 0 ? "below" : "above",
        description: `Price changed ${formatBps(priceChangeBps)}`,
      },
      {
        metric: "volume",
        value: input.volume,
        threshold: String(this.minVolumeChangeBps),
        direction: "above",
        description: `Volume changed ${formatBps(volumeChangeBps)} (cascade)`,
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
        priceChangeBps: String(priceChangeBps),
        volumeChangeBps: String(volumeChangeBps),
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

  return (toVal - fromVal) / fromVal * 10_000;
}

function formatBps(
  bps: number,
): string {
  if (bps >= 0) {
    return `+${bps} bps`;
  }
  return `${bps} bps`;
}
