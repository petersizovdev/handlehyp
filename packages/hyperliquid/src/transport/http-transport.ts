import { HyperliquidError } from "../errors/hyperliquid-error.js";

export interface HttpTransportOptions {
  baseUrl: string;
  timeoutMs?: number;
}

export class HttpTransport {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(options: HttpTransportOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.timeoutMs = options.timeoutMs ?? 10_000;
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const text = await response.text();

      let parsed: unknown = undefined;

      if (text.length > 0) {
        try {
          parsed = JSON.parse(text);
        } catch {
          parsed = text;
        }
      }

      if (!response.ok) {
        throw new HyperliquidError(
          `Hyperliquid HTTP request failed with status ${response.status}`,
          response.status,
          parsed,
        );
      }

      return parsed as T;
    } catch (error) {
      if (error instanceof HyperliquidError) {
        throw error;
      }

      if (error instanceof Error && error.name === "AbortError") {
        throw new HyperliquidError(
          `Hyperliquid request timed out after ${this.timeoutMs}ms`,
        );
      }

      throw new HyperliquidError(
        error instanceof Error
          ? `Hyperliquid request failed: ${error.message}`
          : "Hyperliquid request failed",
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}
