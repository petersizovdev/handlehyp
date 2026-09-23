import type {
  MarketSnapshot,
  MarketDataProvider as ExecutionMarketDataProvider,
  PriceLevel,
} from "@handlehyp/execution";
import type { WsMessage } from "../ws/hyperliquid-ws-client.js";

export interface MarketStateUpdate {
  coin: string;
  midPrice: string;
  bestBid: string;
  bestAsk: string;
  bidLevels: PriceLevel[];
  askLevels: PriceLevel[];
  timestamp: number;
}

export class MarketStateTracker
  implements ExecutionMarketDataProvider
{
  private readonly markets = new Map<
    string,
    MarketStateUpdate
  >();

  update(from: WsMessage): void {
    if (from.channel === "allMids") {
      this.updateAllMids(from);
    } else if (
      from.channel === "l2Book"
    ) {
      const update =
        this.fromL2Book(from);

      if (update !== null) {
        this.markets.set(
          update.coin.toUpperCase(),
          update,
        );
      }
    }
  }

  getMarketSnapshot(
    coin: string,
  ): Promise<MarketSnapshot> {
    const market = this.markets.get(
      coin.toUpperCase(),
    );

    if (market === undefined) {
      return Promise.reject(
        new Error(
          `No market data available for ${coin}`,
        ),
      );
    }

    return Promise.resolve({
      midPrice: market.midPrice,
      bestBid: market.bestBid,
      bestAsk: market.bestAsk,
      bidLevels: [...market.bidLevels],
      askLevels: [...market.askLevels],
    });
  }

  hasMarket(coin: string): boolean {
    return this.markets.has(
      coin.toUpperCase(),
    );
  }

  getAllCoins(): string[] {
    return Array.from(
      this.markets.keys(),
    );
  }

  private updateAllMids(
    msg: Extract<WsMessage, { channel: "allMids" }>,
  ): void {
    const mids = msg.data.mid;

    for (const [
      coin,
      midPrice,
    ] of Object.entries(mids)) {
      if (
        midPrice === undefined ||
        midPrice === ""
      ) {
        continue;
      }

      this.markets.set(
        coin.toUpperCase(),
        {
          coin,
          midPrice,
          bestBid: midPrice,
          bestAsk: midPrice,
          bidLevels: [],
          askLevels: [],
          timestamp: Date.now(),
        },
      );
    }
  }

  private fromL2Book(
    msg: Extract<WsMessage, { channel: "l2Book" }>,
  ): MarketStateUpdate | null {
    const { coin, levels, time } =
      msg.data;

    if (levels.length < 2) {
      return null;
    }

    const buyLevels = levels
      .filter(
        (l) =>
          l.price !== undefined &&
          l.sz !== undefined &&
          Number(l.sz) > 0,
      )
      .sort(
        (a, b) =>
          Number(b.price) -
          Number(a.price),
      );

    const sellLevels = levels
      .filter(
        (l) =>
          l.price !== undefined &&
          l.sz !== undefined &&
          Number(l.sz) > 0,
      )
      .sort(
        (a, b) =>
          Number(a.price) -
          Number(b.price),
      );

    const bid = buyLevels[0];
    const ask = sellLevels[0];

    if (
      bid === undefined ||
      ask === undefined
    ) {
      return null;
    }

    const existing =
      this.markets.get(
        coin.toUpperCase(),
      );

    const midPrice =
      existing?.midPrice ??
      averagePrice(
        bid.price,
        ask.price,
      );

    return {
      coin,
      midPrice,
      bestBid: bid.price,
      bestAsk: ask.price,
      bidLevels: buyLevels.map((l) => ({
        price: l.price,
        size: l.sz,
      })),
      askLevels: sellLevels.map((l) => ({
        price: l.price,
        size: l.sz,
      })),
      timestamp: time,
    };
  }
}

function averagePrice(
  a: string,
  b: string,
): string {
  const avg =
    (Number(a) + Number(b)) /
    2;

  const rounded =
    Math.round(avg * 1e8) /
    1e8;

  return rounded.toString();
}
