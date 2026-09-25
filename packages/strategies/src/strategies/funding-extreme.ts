import type {
  Strategy,
  StrategyMarketData,
  SignalCandidate,
  SignalEvidenceItem,
} from "../domain/strategy.js";

export interface FundingExtremeConfig {
  minFundingChangeBps?: number;
  extremeFundingBps?: number;
  minConfidence?: number;
}

export class FundingExtremeStrategy implements Strategy {
  readonly id = "funding-extreme";
  readonly name = "Funding Extreme";
  readonly description =
    "Detects abnormal funding rate conditions";
  readonly side = "buy" as const;

  private readonly minFundingChangeBps: number;
  private readonly extremeFundingBps: number;
  private readonly minConfidence: number;

  constructor(
    config: FundingExtremeConfig = {},
  ) {
    this.minFundingChangeBps =
      config.minFundingChangeBps ?? 50;
    this.extremeFundingBps =
      config.extremeFundingBps ?? 100;
    this.minConfidence =
      config.minConfidence ?? 55;
  }

  evaluate(
    input: StrategyMarketData,
  ): SignalCandidate | null {
    if (
      input.previousFundingRate === "0" &&
      input.fundingRate === "0"
    ) {
      return null;
    }

    const fundingChangeBps = percentChangeBps(
      input.previousFundingRate,
      input.fundingRate,
    );

    const fundingChangeAbs = Math.abs(fundingChangeBps);

    if (fundingChangeAbs < this.minFundingChangeBps) {
      return null;
    }

    const isExtreme = Math.abs(
      Number(input.fundingRate) * 10_000,
    ) >= this.extremeFundingBps;

    if (!isExtreme) {
      return null;
    }

    const side = Number(input.fundingRate) > 0
      ? "sell"
      : "buy";

    const confidence = Math.min(
      Math.round(
        50 +
          (fundingChangeAbs - this.minFundingChangeBps) /
            100 *
            50,
      ),
      100,
    );

    if (confidence < this.minConfidence) {
      return null;
    }

    const evidence: SignalEvidenceItem[] = [
      {
        metric: "fundingRate",
        value: input.fundingRate,
        threshold: String(this.extremeFundingBps),
        direction: "above",
        description: `Funding rate at ${formatBps(
          Number(input.fundingRate) * 10_000,
        )}`,
      },
      {
        metric: "fundingChange",
        value: String(input.fundingRate),
        threshold: String(this.minFundingChangeBps),
        direction: "above",
        description: `Funding changed ${formatBps(fundingChangeBps)}`,
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
        fundingRate: input.fundingRate,
        fundingChangeBps: String(fundingChangeBps),
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
