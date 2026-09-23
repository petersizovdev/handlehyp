import type {
  MetaAndAssetCtxsResponse,
  PerpAssetCtx,
} from "../types/info.js";
import type { HyperliquidPerpetualMarket } from "../types/market.js";

function contextForAsset(
  contexts: PerpAssetCtx[],
  index: number,
  coin: string,
): PerpAssetCtx {
  const context = contexts[index];

  if (context === undefined) {
    throw new Error(
      `Missing asset context for Hyperliquid market ${coin}`,
    );
  }

  return context;
}

export function mapPerpetualMarkets(
  response: MetaAndAssetCtxsResponse,
): HyperliquidPerpetualMarket[] {
  const [meta, contexts] = response;

  return meta.universe.map((asset, assetIndex) => {
    const context = contextForAsset(contexts, assetIndex, asset.name);

    return {
      assetIndex,
      coin: asset.name,
      symbol: `${asset.name}-PERP`,
      szDecimals: asset.szDecimals,
      maxLeverage: asset.maxLeverage ?? 0,
      marginTableId: asset.marginTableId ?? 0,
      isDelisted: asset.isDelisted ?? false,
      fundingRate: context.funding,
      openInterest: context.openInterest,
      previousDayPrice: context.prevDayPx,
      dailyNotionalVolume: context.dayNtlVlm,
      oraclePrice: context.oraclePx,
      markPrice: context.markPx,
      midPrice: context.midPx ?? null,
      premium: context.premium ?? null,
    };
  });
}
