import { HyperliquidInfoClient } from "./info-client.js";
import { mapPerpetualMarkets } from "./market-mapper.js";
import type { MetaAndAssetCtxsResponse } from "../types/info.js";
import type { HyperliquidPerpetualMarket } from "../types/market.js";

export interface HyperliquidMarketInfoClient {
  metaAndAssetCtxs(dex?: string): Promise<MetaAndAssetCtxsResponse>;
}

export interface MarketServiceOptions {
  client?: HyperliquidMarketInfoClient;
}

export class MarketService {
  private readonly client: HyperliquidMarketInfoClient;

  constructor(options: MarketServiceOptions = {}) {
    this.client = options.client ?? new HyperliquidInfoClient();
  }

  async getPerpetualMarkets(
    dex = "",
  ): Promise<HyperliquidPerpetualMarket[]> {
    const response = await this.client.metaAndAssetCtxs(dex);

    return mapPerpetualMarkets(response);
  }
}
