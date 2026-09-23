export function generateSignalId(
  strategyId: string,
  coin: string,
  timestamp: number,
): string {
  return `${strategyId}:${coin.toLowerCase()}:${timestamp}`;
}
