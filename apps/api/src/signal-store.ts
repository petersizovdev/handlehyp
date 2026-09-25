import type { Signal, SignalStatus, SignalResolution } from "@handlehyp/strategies";

export class InMemorySignalStore {
  private readonly signals = new Map<string, Signal>();

  async save(signal: Omit<Signal, "status">): Promise<void> {
    this.signals.set(signal.id, {
      ...signal,
      status: "active",
    });
  }

  async get(signalId: string): Promise<Signal | null> {
    return this.signals.get(signalId) ?? null;
  }

  async getByCoin(coin: string): Promise<Signal[]> {
    const results: Signal[] = [];

    for (const signal of this.signals.values()) {
      if (signal.coin === coin) {
        results.push(signal);
      }
    }

    return results;
  }

  async update(signal: Signal): Promise<void> {
    this.signals.set(signal.id, signal);
  }

  async resolve(
    signalId: string,
    resolution: SignalResolution,
  ): Promise<void> {
    const signal = this.signals.get(signalId);

    if (signal !== undefined) {
      signal.resolution = resolution;
    }
  }

  async getActive(coin: string): Promise<Signal[]> {
    const results: Signal[] = [];

    for (const signal of this.signals.values()) {
      if (signal.coin === coin && signal.status === "active") {
        results.push(signal);
      }
    }

    return results;
  }
}
