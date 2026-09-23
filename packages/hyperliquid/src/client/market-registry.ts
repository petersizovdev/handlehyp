import type { HyperliquidPerpetualMarket } from "../types/market.js";
import type { HyperliquidOrderMarket } from "../types/trading-adapter.js";

export class HyperliquidMarketRegistry {
  private readonly markets = new Map<string, HyperliquidOrderMarket>();
  private readonly marketDetails = new Map<string, HyperliquidPerpetualMarket>();

  constructor(markets: HyperliquidPerpetualMarket[]) {
    for (const market of markets) {
      const coin = market.coin.trim().toUpperCase();

      if (coin.length === 0) {
        throw new Error("Hyperliquid market coin cannot be empty");
      }

      if (
        !Number.isSafeInteger(market.assetIndex) ||
        market.assetIndex < 0
      ) {
        throw new Error(
          `Invalid Hyperliquid asset index for ${market.coin}`,
        );
      }

      if (this.markets.has(coin)) {
        throw new Error(
          `Duplicate Hyperliquid market: ${coin}`,
        );
      }

      this.markets.set(coin, {
        coin,
        asset: market.assetIndex,
      });
      this.marketDetails.set(coin, market);
    }
  }

  getMarket(coin: string): HyperliquidPerpetualMarket {
    const normalized = coin.trim().toUpperCase();

    if (normalized.length === 0) {
      throw new Error("Hyperliquid market coin cannot be empty");
    }

    const market = this.marketDetails.get(normalized);

    if (market === undefined) {
      throw new Error(
        `Unknown Hyperliquid perpetual market: ${normalized}`,
      );
    }

    return market;
  }

  get(coin: string): HyperliquidOrderMarket {
    const normalized = coin.trim().toUpperCase();

    if (normalized.length === 0) {
      throw new Error("Hyperliquid market coin cannot be empty");
    }

    const market = this.markets.get(normalized);

    if (market === undefined) {
      throw new Error(
        `Unknown Hyperliquid perpetual market: ${normalized}`,
      );
    }

    return market;
  }

  has(coin: string): boolean {
    return this.markets.has(coin.trim().toUpperCase());
  }

  size(): number {
    return this.markets.size;
  }
}
