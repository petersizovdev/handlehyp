import { HyperliquidError } from "../errors/hyperliquid-error.js";
import { HttpTransport } from "../transport/http-transport.js";
import type {
  ExchangeActionRequest,
  ExchangeResponse,
} from "../types/exchange.js";
import type { ExchangeSigner } from "../signing/exchange-signer.js";

export interface ExchangeExecutorOptions {
  baseUrl?: string;
  timeoutMs?: number;
  signer: ExchangeSigner;
}

const DEFAULT_BASE_URL = "https://api.hyperliquid.xyz";

export class HyperliquidExchangeExecutor {
  private readonly transport: HttpTransport;
  private readonly signer: ExchangeSigner;

  constructor(options: ExchangeExecutorOptions) {
    this.transport = new HttpTransport({
      baseUrl: options.baseUrl ?? DEFAULT_BASE_URL,
      timeoutMs: options.timeoutMs ?? 10_000,
    });

    this.signer = options.signer;
  }

  async execute(
    action: unknown,
    nonce: number,
  ): Promise<ExchangeResponse> {
    if (!Number.isSafeInteger(nonce) || nonce <= 0) {
      throw new HyperliquidError("Invalid exchange nonce");
    }

    const signature = await this.signer.signExchangeAction(
      action,
      nonce,
    );

    const request: ExchangeActionRequest = {
      action,
      nonce,
      signature,
    };

    return this.transport.post<ExchangeResponse>(
      "/exchange",
      request,
    );
  }
}
