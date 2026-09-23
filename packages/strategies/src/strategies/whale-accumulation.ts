import type {
  Strategy,
  StrategyMarketData,
  SignalCandidate,
  SignalEvidenceItem,
} from "../domain/strategy.js";

export interface WhaleAccumulationConfig {
  minVolumeChangeBps?: number;
  minOiChangeBps?: number;
  minConfidence?: number;
}

export class WhaleAccumulationStrategy implements Strategy {
  readonly id = "whale-accumulation";
  readonly name = "Whale Accumulation";
  readonly description =
    "Detects unusual accumulation behaviour";
  readonly side = "buy" as const;

  private readonly minVolumeChangeBps: number;
  private readonly minOiChangeBps: number;
  private readonly minConfidence: number;

  constructor(
    config: WhaleAccumulationConfig = {},
  ) {
    this.minVolumeChangeBps =
      config.minVolumeChangeBps ?? 500;
    this.minOiChangeBps =
      config.minOiChangeBps ?? 200;
    this.minConfidence =
      config.minConfidence ?? 60;
  }

  evaluate(
    input: StrategyMarketData,
  ): SignalCandidate | null {
    if (
      input.volume === "0" ||
      input.previousVolume === "0" ||
      input.openInterest === "0" ||
      input.previousOpenInterest === "0"
    ) {
      return null;
    }

    const volumeChangeBps = percentChangeBps(
      input.previousVolume,
      input.volume,
    );

    const oiChangeBps = percentChangeBps(
      input.previousOpenInterest,
      input.openInterest,
    );

    if (volumeChangeBps < this.minVolumeChangeBps) {
      return null;
    }

    if (oiChangeBps < this.minOiChangeBps) {
      return null;
    }

    const side = "buy" as const;

    const confidence = Math.min(
      Math.round(
        50 +
          (volumeChangeBps - this.minVolumeChangeBps) /
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
        metric: "volume",
        value: input.volume,
        threshold: String(this.minVolumeChangeBps),
        direction: "above",
        description: `Volume changed ${formatBps(volumeChangeBps)}`,
      },
      {
        metric: "openInterest",
        value: input.openInterest,
        threshold: String(this.minOiChangeBps),
        direction: "above",
        description: `OI changed ${formatBps(oiChangeBps)} (accumulation)`,
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
        volumeChangeBps: String(volumeChangeBps),
        oiChangeBps: String(oiChangeBps),
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
