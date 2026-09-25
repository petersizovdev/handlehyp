import type { MiniAppSignal } from "./types.js";

export function formatSignalCard(signal: MiniAppSignal): string {
  const sideEmoji = signal.side === "buy" ? "↑" : "↓";
  const confBar = "█".repeat(Math.floor(signal.confidence / 10)) +
    "░".repeat(10 - Math.floor(signal.confidence / 10));

  return [
    `┌─ ${signal.name} (${signal.coin}) ${sideEmoji} ─┐`,
    `│ Confidence: ${confBar} ${signal.confidence}%`,
    `│ Entry: ${signal.entryPrice}`,
    `│ Evidence: ${signal.evidence.length} items`,
    `│ ID: ${signal.id}`,
    `└────────────────────────────┘`,
  ].join("\n");
}

export function formatSignalList(signals: MiniAppSignal[]): string {
  if (signals.length === 0) {
    return "No signals";
  }

  return signals
    .map(
      (s, i) =>
        `${i + 1}. ${s.name} (${s.coin}) ${s.side === "buy" ? "BUY" : "SELL"} — ${s.confidence}%`,
    )
    .join("\n");
}
