import { HttpTransport } from "../transport/http-transport.js";
import type {
  BuilderFeeApprovalAction,
  BuilderFeeRequest,
  MaxBuilderFeeResponse,
} from "../types/exchange.js";

export interface HyperliquidExchangeClientOptions {
  baseUrl?: string;
  timeoutMs?: number;
}

const DEFAULT_BASE_URL = "https://api.hyperliquid.xyz";

export class HyperliquidExchangeClient {
  private readonly transport: HttpTransport;

  constructor(options: HyperliquidExchangeClientOptions = {}) {
    this.transport = new HttpTransport({
      baseUrl: options.baseUrl ?? DEFAULT_BASE_URL,
      timeoutMs: options.timeoutMs ?? 10_000,
    });
  }

  async maxBuilderFee(
    user: string,
    builder: string,
  ): Promise<MaxBuilderFeeResponse> {
    return this.transport.post<MaxBuilderFeeResponse>("/info", {
      type: "maxBuilderFee",
      user,
      builder,
    } satisfies BuilderFeeRequest);
  }

  createBuilderFeeApprovalAction(
    builder: string,
    maxFeeRate: number,
  ): BuilderFeeApprovalAction {
    return {
      type: "approveBuilderFee",
      builder,
      maxFeeRate,
    };
  }
}
