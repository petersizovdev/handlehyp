import { useState } from "react";
import { validateTradingAction } from "../trading.js";
import type { MiniAppSignal } from "../types.js";

interface TradingActionProps {
  signal: MiniAppSignal;
  onAction: (
    type: "buy" | "sell",
    coin: string,
    size: string,
  ) => void;
}

export function TradingAction({
  signal,
  onAction,
}: TradingActionProps) {
  const [size, setSize] = useState("0.1");
  const [errors, setErrors] = useState<string[]>([]);

  const handleClick = (type: "buy" | "sell") => {
    const action = {
      type,
      coin: signal.coin,
      size,
      signalId: signal.id,
    };

    const validation = validateTradingAction(action);

    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setErrors([]);
    onAction(type, signal.coin, size);
  };

  return (
    <div style={{ flex: 1 }}>
      {errors.length > 0 && (
        <div
          style={{
            fontSize: 12,
            color: "#ef4444",
            marginBottom: 8,
          }}
        >
          {errors.map((e, i) => (
            <div key={i}>{e}</div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="number"
          step="0.1"
          value={size}
          onChange={(e) => setSize(e.target.value)}
          style={{
            width: 60,
            padding: 14,
            borderRadius: 10,
            border: "1px solid #333",
            background: "#141414",
            color: "#e8e8e8",
            fontSize: 14,
            textAlign: "center",
          }}
        />

        <button
          className="btn btn-buy"
          onClick={() => handleClick("buy")}
        >
          BUY {signal.coin}
        </button>

        <button
          className="btn btn-sell"
          onClick={() => handleClick("sell")}
        >
          SELL {signal.coin}
        </button>
      </div>
    </div>
  );
}
