import type { ExchangeSigner } from "./exchange-signer.js";

export class UnconfiguredExchangeSigner implements ExchangeSigner {
  async signExchangeAction(
    action: unknown,
    nonce: number,
  ): Promise<never> {
    void action;
    void nonce;

    throw new Error(
      "Hyperliquid exchange signer is not configured",
    );
  }
}
