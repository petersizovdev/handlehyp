export interface InfoRequest {
  type: string;
  [key: string]: unknown;
}

export interface PerpAsset {
  name: string;
  szDecimals: number;
  maxLeverage?: number;
  marginTableId?: number;
  onlyIsolated?: boolean;
  isDelisted?: boolean;
}

export interface PerpMeta {
  universe: PerpAsset[];
  marginTables?: unknown[];
}

export interface PerpAssetCtx {
  coin?: string;
  funding: string;
  openInterest: string;
  prevDayPx: string;
  dayNtlVlm: string;
  dayBaseVlm?: string;
  premium?: string;
  oraclePx: string;
  markPx: string;
  midPx?: string;
  impactPxs?: string[];
}

export type MetaAndAssetCtxsResponse = [
  PerpMeta,
  PerpAssetCtx[],
];

export type AllMidsResponse = Record<string, string>;
