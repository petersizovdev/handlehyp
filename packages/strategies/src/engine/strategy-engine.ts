import type {
  Signal,
  SignalStatus,
  SignalResolution,
} from "../domain/signal.js";
import type {
  SignalStore,
} from "../domain/signal-store.js";
import type {
  Strategy,
  StrategyMarketData,
  SignalCandidate,
} from "../domain/strategy.js";
import { generateSignalId } from "../domain/signal-id.js";

export interface StrategyEngineOptions {
  strategies: Strategy[];
  signalStore: SignalStore;
  defaultTtlMs?: number;
}

export class StrategyEngine {
  private readonly strategies: Strategy[];
  private readonly signalStore: SignalStore;
  private readonly defaultTtlMs: number;

  constructor(
    options: StrategyEngineOptions,
  ) {
    this.strategies = options.strategies;
    this.signalStore =
      options.signalStore;
    this.defaultTtlMs =
      options.defaultTtlMs ?? 3600_000;
  }

  async evaluate(
    data: StrategyMarketData,
  ): Promise<Signal[]> {
    const signals: Signal[] = [];

    for (const strategy of this.strategies) {
      const candidate =
        strategy.evaluate(data);

      if (candidate !== null) {
        const signal =
          this.toSignal(
            candidate,
            data,
          );

        signals.push(signal);

        await this.signalStore.save({
          id: signal.id,
          strategyId:
            signal.strategyId,
          name: signal.name,
          coin: signal.coin,
          side: signal.side,
          confidence:
            signal.confidence,
          evidence:
            signal.evidence,
          entryPrice:
            signal.entryPrice,
          timestamp:
            signal.timestamp,
          expiresAt: signal.expiresAt,
          metadata:
            signal.metadata,
        });
      }
    }

    return signals;
  }

  async getActiveSignals(
    coin: string,
  ): Promise<Signal[]> {
    return this.signalStore.getActive(
      coin,
    );
  }

  async resolve(
    signalId: string,
    resolution: SignalResolution,
  ): Promise<void> {
    const signal =
      await this.signalStore.get(
        signalId,
      );

    if (signal === null) {
      throw new Error(
        `Unknown signal: ${signalId}`,
      );
    }

    signal.status =
      "resolved" as SignalStatus;
    signal.resolution = resolution;

    await this.signalStore.update(signal);
    await this.signalStore.resolve(
      signalId,
      resolution,
    );
  }

  async expire(
    signalId: string,
  ): Promise<void> {
    const signal =
      await this.signalStore.get(
        signalId,
      );

    if (signal === null) {
      return;
    }

    signal.status =
      "expired" as SignalStatus;

    await this.signalStore.update(signal);
  }

  private toSignal(
    candidate: SignalCandidate,
    data: StrategyMarketData,
  ): Signal {
    const timestamp =
      data.timestamp;

    return {
      id: generateSignalId(
        candidate.strategyId,
        candidate.coin,
        timestamp,
      ),
      strategyId: candidate.strategyId,
      name: candidate.name,
      coin: candidate.coin,
      side: candidate.side,
      confidence:
        candidate.confidence,
      evidence: candidate.evidence,
      entryPrice:
        candidate.entryPrice,
      timestamp,
      expiresAt:
        timestamp + this.defaultTtlMs,
      status:
        "active" as SignalStatus,
      metadata:
        candidate.metadata,
    };
  }
}
