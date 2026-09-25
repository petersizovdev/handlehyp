import type { MiniAppSignal } from "../types.js";

interface SignalCardProps {
  signal: MiniAppSignal;
  isActive: boolean;
  onClick: () => void;
}

export function SignalCard({
  signal,
  isActive,
  onClick,
}: SignalCardProps) {
  const confPercent = `${Math.floor(signal.confidence / 10) * 10}%`;

  return (
    <div
      className={`signal-card ${isActive ? "active" : ""}`}
      onClick={onClick}
    >
      <div className="signal-header">
        <span className="signal-name">{signal.name}</span>
        <span className="signal-coin">{signal.coin}</span>
      </div>

      <div
        className={`signal-side ${signal.side}`}
        style={{ display: "inline-block" }}
      >
        {signal.side === "buy" ? "BUY" : "SELL"}
      </div>

      <div className="signal-confidence">
        <span>Confidence</span>
        <div className="conf-bar">
          <div
            className="conf-fill"
            style={{ width: confPercent }}
          />
        </div>
        <span>{signal.confidence}%</span>
      </div>

      <div className="entry-price">Entry: {signal.entryPrice}</div>

      {isActive && (
        <div className="signal-detail">
          {signal.evidence.map((ev, i) => (
            <div className="evidence-item" key={i}>
              <span>
                {ev.metric}: {ev.value}
              </span>
              <span>{ev.description}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
