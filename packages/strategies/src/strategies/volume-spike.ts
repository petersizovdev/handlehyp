import type {
  Strategy,
  StrategyMarketData,
  SignalCandidate,
  SignalEvidenceItem,
} from "../domain/strategy.js";

export interface VolumeSpikeConfig {
  minVolumeChangeBps?: number;
  maxPriceChangeBps?: number;
  minConfidence?: number;
}

export class VolumeSpikeStrategy
  implements Strategy
{
  readonly id = "volume-spike";
  readonly name = "Volume Spike";
  readonly description =
    "Detects abnormal volume without proportional price movement";
  readonly side = "buy" as const;

  private readonly minVolumeChangeBps: number;
  private readonly maxPriceChangeBps: number;
  private readonly minConfidence: number;

  constructor(
    config: VolumeSpikeConfig = {},
  ) {
    this.minVolumeChangeBps =
      config.minVolumeChangeBps ?? 500;
    this.maxPriceChangeBps =
      config.maxPriceChangeBps ?? 20;
    this.minConfidence =
      config.minConfidence ?? 55;
  }

  evaluate(
    input: StrategyMarketData,
  ): SignalCandidate | null {
    if (
      input.volume === "0" ||
      input.previousVolume === "0"
    ) {
      return null;
    }

    const volumeChangeBps =
      percentChangeBps(
        input.previousVolume,
        input.volume,
      );

    const priceChangeBps = percentChangeBps(
      input.previousPrice,
      input.price,
    );

    const priceChangeAbs =
      Math.abs(priceChangeBps);

    if (
      volumeChangeBps <
        this.minVolumeChangeBps ||
      priceChangeAbs >
        this.maxPriceChangeBps
    ) {
      return null;
    }

    const side =
      priceChangeBps >= 0
        ? "buy"
        : "sell";

    const confidence = Math.min(
      Math.round(
        50 +
          (volumeChangeBps -
            this.minVolumeChangeBps) /
            200 *
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
        metric: "volume",
        value: input.volume,
        threshold: String(
          this.minVolumeChangeBps,
        ),
        direction: "above",
        description:
          `Volume changed ${formatBps(volumeChangeBps)}`,
      },
      {
        metric: "price",
        value: input.price,
        threshold: String(
          this.maxPriceChangeBps,
        ),
        direction:
          priceChangeBps >= 0
            ? "above"
            : "below",
        description:
          `Price changed ${formatBps(priceChangeBps)}`,
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
        volumeChangeBps: String(
          volumeChangeBps,
        ),
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
