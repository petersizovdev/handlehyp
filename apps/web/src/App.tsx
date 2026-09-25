import { useState } from "react";
import type { MiniAppSignal, MiniAppState } from "./types.js";
import { SignalCatalog } from "./catalog.js";
import { SignalCard } from "./components/SignalCard.js";
import { TradingAction } from "./components/TradingAction.js";

const SAMPLE_SIGNALS: MiniAppSignal[] = [
  {
    id: "oi-anomaly:btc:1000000",
    strategyId: "oi-anomaly",
    name: "OI Anomaly",
    coin: "BTC",
    side: "buy",
    confidence: 75,
    entryPrice: "61000",
    evidence: [
      {
        metric: "openInterest",
        value: "44000000",
        threshold: "500",
        direction: "above",
        description: "OI changed +1000 bps",
      },
      {
        metric: "price",
        value: "61000",
        threshold: "50",
        direction: "below",
        description: "Price changed only +167 bps",
      },
    ],
  },
  {
    id: "volume-spike:eth:1000000",
    strategyId: "volume-spike",
    name: "Volume Spike",
    coin: "ETH",
    side: "buy",
    confidence: 68,
    entryPrice: "3400",
    evidence: [
      {
        metric: "volume",
        value: "50000000",
        threshold: "500",
        direction: "above",
        description: "Volume changed +40000 bps",
      },
      {
        metric: "price",
        value: "3410",
        threshold: "20",
        direction: "above",
        description: "Price changed +30 bps",
      },
    ],
  },
  {
    id: "funding-extreme:btc:1000000",
    strategyId: "funding-extreme",
    name: "Funding Extreme",
    coin: "BTC",
    side: "sell",
    confidence: 82,
    entryPrice: "60500",
    evidence: [
      {
        metric: "fundingRate",
        value: "0.01",
        threshold: "100",
        direction: "above",
        description: "Funding rate at +100 bps",
      },
      {
        metric: "fundingChange",
        value: "0.01",
        threshold: "50",
        direction: "above",
        description: "Funding changed +190000 bps",
      },
    ],
  },
  {
    id: "whale-accumulation:btc:2000000",
    strategyId: "whale-accumulation",
    name: "Whale Accumulation",
    coin: "BTC",
    side: "buy",
    confidence: 58,
    entryPrice: "61200",
    evidence: [
      {
        metric: "volume",
        value: "80000000",
        threshold: "500",
        direction: "above",
        description: "Volume changed +70000 bps",
      },
      {
        metric: "openInterest",
        value: "60000000",
        threshold: "200",
        direction: "above",
        description: "OI changed +2000 bps (accumulation)",
      },
    ],
  },
  {
    id: "liquidation-cascade:btc:3000000",
    strategyId: "liquidation-cascade",
    name: "Liquidation Cascade",
    coin: "BTC",
    side: "sell",
    confidence: 71,
    entryPrice: "55000",
    evidence: [
      {
        metric: "price",
        value: "55000",
        threshold: "200",
        direction: "below",
        description: "Price changed -10000 bps",
      },
      {
        metric: "volume",
        value: "120000000",
        threshold: "1000",
        direction: "above",
        description: "Volume changed +110000 bps (cascade)",
      },
    ],
  },
];

export function App() {
  const catalog = new SignalCatalog();
  catalog.loadSignals(SAMPLE_SIGNALS);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [executed, setExecuted] = useState<
    Array<{ action: string; coin: string; size: string; price: string; time: number }>
  >([]);

  const state: MiniAppState = {
    catalog: catalog.getState(),
  };

  const selectedSignal = selectedId
    ? catalog.getSignalById(selectedId)
    : undefined;

  const handleTrade = (
    type: "buy" | "sell",
    coin: string,
    size: string,
  ) => {
    setExecuted((prev) => [
      ...prev,
      {
        action: type.toUpperCase(),
        coin,
        size,
        price: selectedSignal?.entryPrice ?? "0",
        time: Date.now(),
      },
    ]);
  };

  return (
    <div>
      <div className="app-header">HandleHYP</div>

      <h2 style={{ fontSize: 14, color: "#94a3b8", marginBottom: 12 }}>
        Signals
      </h2>

      {state.catalog.signals.length === 0 ? (
        <div className="empty-state">No active signals</div>
      ) : (
        state.catalog.signals.map((signal) => (
          <SignalCard
            key={signal.id}
            signal={signal}
            isActive={selectedId === signal.id}
            onClick={() =>
              setSelectedId(selectedId === signal.id ? null : signal.id)
            }
          />
        ))
      )}

      {selectedSignal && (
        <>
          <div className="action-bar">
            <TradingAction
              signal={selectedSignal}
              onAction={handleTrade}
            />
          </div>

          <div className="result-box">
            <h3
              style={{
                fontSize: 14,
                color: "#94a3b8",
                marginBottom: 8,
              }}
            >
              Recent executions
            </h3>
            {executed.length === 0 ? (
              <div style={{ fontSize: 13, color: "#64748b" }}>
                No executions yet
              </div>
            ) : (
              executed.map((ex, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 12,
                    padding: "4px 0",
                    color: "#94a3b8",
                    borderBottom: "1px solid #222",
                  }}
                >
                  <span
                    style={{
                      color:
                        ex.action === "BUY" ? "#22c55e" : "#ef4444",
                      fontWeight: 700,
                    }}
                  >
                    {ex.action}
                  </span>{" "}
                  {ex.size} {ex.coin} @ {ex.price}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
