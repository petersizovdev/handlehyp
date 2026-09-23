import type { MiniAppSignal, SignalCatalogState } from "./types.js";

export class SignalCatalog {
  private signals: MiniAppSignal[] = [];
  private selectedSignalId: string | null = null;

  loadSignals(signals: MiniAppSignal[]): void {
    this.signals = signals;
  }

  selectSignal(signalId: string | null): void {
    this.selectedSignalId = signalId;
  }

  getState(): SignalCatalogState {
    return {
      signals: [...this.signals],
      selectedSignalId: this.selectedSignalId,
    };
  }

  getActiveSignals(): MiniAppSignal[] {
    return this.signals.filter((s) => s.confidence > 0);
  }

  getSignalById(signalId: string): MiniAppSignal | undefined {
    return this.signals.find((s) => s.id === signalId);
  }

  getSignalsByCoin(coin: string): MiniAppSignal[] {
    return this.signals.filter(
      (s) => s.coin === coin,
    );
  }

  getSignalsBySide(side: "buy" | "sell"): MiniAppSignal[] {
    return this.signals.filter(
      (s) => s.side === side,
    );
  }

  getTopSignals(limit: number = 5): MiniAppSignal[] {
    return [...this.signals]
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);
  }
}
