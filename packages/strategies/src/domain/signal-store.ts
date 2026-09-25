import type {
  Signal,
  SignalStatus,
  SignalResolution,
} from "./signal.js";

export interface SignalStore {
  save(
    signal: Omit<Signal, "status">,
  ): Promise<void>;

  get(
    signalId: string,
  ): Promise<Signal | null>;

  getByCoin(
    coin: string,
  ): Promise<Signal[]>;

  update(
    signal: Signal,
  ): Promise<void>;

  resolve(
    signalId: string,
    resolution: SignalResolution,
  ): Promise<void>;

  getActive(
    coin: string,
  ): Promise<Signal[]>;
}

export interface SignalStoreOptions {
  ttlMs?: number;
}
