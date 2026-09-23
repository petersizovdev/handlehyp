export interface ExchangeSigner {
  signExchangeAction(
    action: unknown,
    nonce: number,
  ): Promise<unknown>;
}
