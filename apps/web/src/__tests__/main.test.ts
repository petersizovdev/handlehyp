import { describe, expect, it } from "vitest";
import { HandleHYPApp, SignalCatalog } from "../lib.js";
import type { MiniAppSignal } from "../types.js";

function makeSignal(overrides: Partial<MiniAppSignal>): MiniAppSignal {
  return {
    id: "sig-1",
    strategyId: "oi-anomaly",
    name: "OI Anomaly",
    coin: "BTC",
    side: "buy",
    confidence: 70,
    entryPrice: "60000",
    evidence: [],
    ...overrides,
  };
}

describe("HandleHYPApp", () => {
  it("initializes with empty state", () => {
    const app = new HandleHYPApp();
    const state = app.getState();

    expect(state.catalog.signals).toHaveLength(0);
    expect(state.catalog.selectedSignalId).toBeNull();
  });

  it("loads signals into catalog", () => {
    const app = new HandleHYPApp();

    app.loadSignals([makeSignal({ id: "sig-1" })]);

    const state = app.getState();
    expect(state.catalog.signals).toHaveLength(1);
    expect(state.catalog.signals[0]!.id).toBe("sig-1");
  });

  it("selects a signal", () => {
    const app = new HandleHYPApp();
    app.loadSignals([makeSignal({ id: "sig-1" })]);

    app.selectSignal("sig-1");

    expect(app.getState().catalog.selectedSignalId).toBe("sig-1");
  });

  it("clears selection when null", () => {
    const app = new HandleHYPApp();
    app.loadSignals([makeSignal({ id: "sig-1" })]);
    app.selectSignal("sig-1");

    app.selectSignal(null);

    expect(app.getState().catalog.selectedSignalId).toBeNull();
  });
});

describe("SignalCatalog", () => {
  it("gets active signals", () => {
    const catalog = new SignalCatalog();

    catalog.loadSignals([
      makeSignal({ id: "s1", confidence: 70 }),
      makeSignal({ id: "s2", confidence: 0 }),
    ]);

    const active = catalog.getActiveSignals();
    expect(active).toHaveLength(1);
    expect(active[0]!.id).toBe("s1");
  });

  it("gets signals by coin", () => {
    const catalog = new SignalCatalog();

    catalog.loadSignals([
      makeSignal({ id: "s1", coin: "BTC" }),
      makeSignal({ id: "s2", coin: "ETH" }),
      makeSignal({ id: "s3", coin: "BTC" }),
    ]);

    const btc = catalog.getSignalsByCoin("BTC");
    expect(btc).toHaveLength(2);
  });

  it("gets signals by side", () => {
    const catalog = new SignalCatalog();

    catalog.loadSignals([
      makeSignal({ id: "s1", side: "buy" }),
      makeSignal({ id: "s2", side: "sell" }),
      makeSignal({ id: "s3", side: "buy" }),
    ]);

    const buys = catalog.getSignalsBySide("buy");
    expect(buys).toHaveLength(2);
  });

  it("returns top signals by confidence", () => {
    const catalog = new SignalCatalog();

    catalog.loadSignals([
      makeSignal({ id: "s1", confidence: 30 }),
      makeSignal({ id: "s2", confidence: 90 }),
      makeSignal({ id: "s3", confidence: 60 }),
    ]);

    const top = catalog.getTopSignals(2);
    expect(top).toHaveLength(2);
    expect(top[0]!.confidence).toBe(90);
    expect(top[1]!.confidence).toBe(60);
  });

  it("gets signal by ID", () => {
    const catalog = new SignalCatalog();

    catalog.loadSignals([makeSignal({ id: "s1" })]);

    const found = catalog.getSignalById("s1");
    expect(found).toBeDefined();
    expect(found!.id).toBe("s1");
  });

  it("returns undefined for unknown signal ID", () => {
    const catalog = new SignalCatalog();

    const found = catalog.getSignalById("unknown");
    expect(found).toBeUndefined();
  });
});
