import { HttpTransport } from "../transport/http-transport.js";
import type {
  AllMidsResponse,
  InfoRequest,
  MetaAndAssetCtxsResponse,
  PerpMeta,
} from "../types/info.js";

export interface HyperliquidInfoClientOptions {
  baseUrl?: string;
  timeoutMs?: number;
}

const DEFAULT_BASE_URL = "https://api.hyperliquid.xyz";

export class HyperliquidInfoClient {
  private readonly transport: HttpTransport;

  constructor(options: HyperliquidInfoClientOptions = {}) {
    this.transport = new HttpTransport({
      baseUrl: options.baseUrl ?? DEFAULT_BASE_URL,
      timeoutMs: options.timeoutMs ?? 10_000,
    });
  }

  async postInfo<T>(request: InfoRequest): Promise<T> {
    return this.transport.post<T>("/info", request);
  }

  async meta(dex = ""): Promise<PerpMeta> {
    return this.postInfo<PerpMeta>({
      type: "meta",
      dex,
    });
  }

  async metaAndAssetCtxs(
    dex = "",
  ): Promise<MetaAndAssetCtxsResponse> {
    return this.postInfo<MetaAndAssetCtxsResponse>({
      type: "metaAndAssetCtxs",
      dex,
    });
  }

  async allMids(dex = ""): Promise<AllMidsResponse> {
    return this.postInfo<AllMidsResponse>({
      type: "allMids",
      dex,
    });
  }
}
