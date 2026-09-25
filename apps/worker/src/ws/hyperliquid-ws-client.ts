import type {
  AllMidsData,
  L2BookData,
  Subscription,
  TradesData,
  WsConnectionOptions,
  WsChannel,
  WsMessage,
} from "./types.js";
import { DEFAULT_WS_URL } from "./types.js";

export type { WsMessage };

export type WsMessageHandler = (
  message: WsMessage,
) => void;

export class HyperliquidWebSocketClient {
  private readonly url: string;
  private readonly reconnectDelayMs: number;
  private readonly pingIntervalMs: number;

  private ws: WebSocket | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  private handlers: WsMessageHandler[] = [];
  private subscriptions: Subscription[] = [];
  private connecting = false;
  private destroyed = false;

  constructor(
    options: WsConnectionOptions = {},
  ) {
    this.url =
      options.url ?? DEFAULT_WS_URL;
    this.reconnectDelayMs =
      options.reconnectDelayMs ?? 5_000;
    this.pingIntervalMs =
      options.pingIntervalMs ?? 30_000;
  }

  get readyState(): number {
    return this.ws?.readyState ?? 3;
  }

  subscribe(
    channel: WsChannel,
    coin?: string,
    interval?: string,
  ): void {
    const sub: Subscription = {
      type: channel,
      ...(coin !== undefined ? { coin } : {}),
      ...(interval !== undefined ? { interval } : {}),
    };

    this.subscriptions.push(sub);
    this.sendSubscription(sub, true);
  }

  unsubscribe(
    channel: WsChannel,
    coin?: string,
  ): void {
    const index = this.subscriptions.findIndex(
      (s) =>
        s.type === channel &&
        s.coin === coin,
    );

    if (index !== -1) {
      const sub = this.subscriptions[index]!;
      this.subscriptions.splice(index, 1);
      this.sendSubscription(sub, false);
    }
  }

  onMessage(
    handler: WsMessageHandler,
  ): () => void {
    this.handlers.push(handler);

    return () => {
      const idx =
        this.handlers.indexOf(handler);

      if (idx !== -1) {
        this.handlers.splice(idx, 1);
      }
    };
  }

  connect(): void {
    if (this.destroyed) {
      return;
    }

    if (this.connecting) {
      return;
    }

    this.connecting = true;
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.connecting = false;
      this.startPing();
      this.resubscribe();
    };

    this.ws.onmessage = (
      event: MessageEvent,
    ) => {
      this.handleMessage(event.data);
    };

    this.ws.onclose = () => {
      this.connecting = false;
      this.stopPing();
      this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  disconnect(): void {
    this.destroyed = true;
    this.stopPing();
    this.clearReconnect();

    if (this.ws !== null) {
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.close();
      this.ws = null;
    }
  }

  private startPing(): void {
    this.pingTimer = setInterval(() => {
      if (
        this.ws !== null &&
        this.ws.readyState === WebSocket.OPEN
      ) {
        this.ws.send(
          JSON.stringify({
            method: "ping",
          }),
        );
      }
    }, this.pingIntervalMs);
  }

  private stopPing(): void {
    if (this.pingTimer !== null) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.destroyed) {
      return;
    }

    this.reconnectTimer = setTimeout(
      () => {
        if (!this.destroyed) {
          this.connect();
        }
      },
      this.reconnectDelayMs,
    );
  }

  private clearReconnect(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private resubscribe(): void {
    for (const sub of this.subscriptions) {
      this.sendSubscription(sub, true);
    }
  }

  private sendSubscription(
    sub: Subscription,
    subscribe: boolean,
  ): void {
    if (
      this.ws === null ||
      this.ws.readyState !== WebSocket.OPEN
    ) {
      return;
    }

    const msg: {
      method: string;
      subscription: {
        type: string;
        coin?: string;
        interval?: string;
      };
    } = {
      method: subscribe
        ? "subscribe"
        : "unsubscribe",
      subscription: {
        type: sub.type,
      },
    };

    if (sub.coin !== undefined) {
      msg.subscription.coin = sub.coin;
    }

    if (sub.interval !== undefined) {
      msg.subscription.interval =
        sub.interval;
    }

    this.ws.send(JSON.stringify(msg));
  }

  private handleMessage(
    data: string,
  ): void {
    let parsed: unknown;

    try {
      parsed = JSON.parse(data);
    } catch {
      return;
    }

    const msg = this.parseMessage(parsed);

    if (msg !== null) {
      for (const handler of this.handlers) {
        handler(msg);
      }
    }
  }

  private parseMessage(
    data: unknown,
  ): WsMessage | null {
    if (
      typeof data !== "object" ||
      data === null
    ) {
      return null;
    }

    const obj =
      data as Record<string, unknown>;

    const channel =
      obj.channel as string | undefined;

    if (
      channel === "allMids" &&
      typeof obj.data === "object" &&
      obj.data !== null
    ) {
      const d = obj.data as {
        mid?: unknown;
      };

      if (typeof d.mid === "object" && d.mid !== null) {
        return {
          channel: "allMids",
          data: {
            mid:
              d.mid as Record<string, string>,
          },
        } as AllMidsData;
      }
    }

    if (
      channel === "l2Book" &&
      typeof obj.data === "object" &&
      obj.data !== null
    ) {
      const d = obj.data as {
        coin?: unknown;
        levels?: unknown;
        time?: unknown;
      };

      if (
        typeof d.coin === "string" &&
        Array.isArray(d.levels)
      ) {
        return {
          channel: "l2Book",
          data: {
            coin: d.coin,
            levels: d.levels as Array<{
              price: string;
              sz: string;
              n?: number;
            }>,
            time:
              typeof d.time === "number"
                ? d.time
                : Date.now(),
          },
        } as L2BookData;
      }
    }

    if (
      channel === "trades" &&
      typeof obj.data === "object" &&
      obj.data !== null
    ) {
      const d = obj.data as {
        coin?: unknown;
        trades?: unknown;
      };

      if (
        typeof d.coin === "string" &&
        Array.isArray(d.trades)
      ) {
        return {
          channel: "trades",
          data: {
            coin: d.coin,
            trades: d.trades as Array<{
              price: string;
              size: string;
              side: "buy" | "sell";
              time: number;
            }>,
          },
        } as TradesData;
      }
    }

    return null;
  }
}
