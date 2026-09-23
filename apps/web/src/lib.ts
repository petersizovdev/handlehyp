import { SignalCatalog } from "./catalog.js";
import type { MiniAppSignal, MiniAppState } from "./types.js";

export class HandleHYPApp {
  private catalog: SignalCatalog;
  private state: MiniAppState;

  constructor() {
    this.catalog = new SignalCatalog();
    this.state = {
      catalog: {
        signals: [],
        selectedSignalId: null,
      },
    };
  }

  getCatalog(): SignalCatalog {
    return this.catalog;
  }

  loadSignals(signals: MiniAppSignal[]): void {
    this.catalog.loadSignals(signals);
    this.state.catalog = this.catalog.getState();
  }

  selectSignal(signalId: string | null): void {
    this.catalog.selectSignal(signalId);
    this.state.catalog = this.catalog.getState();
  }

  getState(): MiniAppState {
    return { ...this.state };
  }
}

export { SignalCatalog };
export type { MiniAppSignal, MiniAppState } from "./types.js";
