export class HyperliquidError extends Error {
  readonly status: number | undefined;
  readonly body: unknown;

  constructor(
    message: string,
    status?: number,
    body?: unknown,
  ) {
    super(message);
    this.name = "HyperliquidError";
    this.status = status;
    this.body = body;
  }
}
