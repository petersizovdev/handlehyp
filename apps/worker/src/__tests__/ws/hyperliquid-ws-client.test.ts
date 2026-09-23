import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HyperliquidWebSocketClient } from "../../ws/hyperliquid-ws-client.js";
import type { WsMessage } from "../../ws/types.js";

let originalWebSocket: typeof WebSocket;

class MockWebSocket {
  static instances: MockWebSocket[] = [];

  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  url: string;
  readyState = 0;
  send = vi.fn();
  close = vi.fn();
  onopen: ((ev: Event) => void) | null =
    null;
  onclose: ((
    ev: CloseEvent,
  ) => void) | null = null;
  onmessage: ((
    ev: MessageEvent,
  ) => void) | null = null;
  onerror: ((ev: Event) => void) | null =
    null;

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  triggerOpen(): void {
    this.readyState = 1;
    this.onopen?.({} as Event);
  }

  triggerMessage(
    data: string,
  ): void {
    this.onmessage?.({
      data,
    } as MessageEvent);
  }

  triggerClose(): void {
    this.readyState = 3;
    this.onclose?.({
      code: 1000,
    } as CloseEvent);
  }
}

function getWs(): MockWebSocket {
  return MockWebSocket.instances[
    MockWebSocket.instances.length - 1
  ]!;
}

describe("HyperliquidWebSocketClient", () => {
  beforeEach(() => {
    originalWebSocket = globalThis.WebSocket;
    MockWebSocket.instances = [];
    globalThis.WebSocket =
      MockWebSocket as unknown as typeof WebSocket;
  });

  afterEach(() => {
    globalThis.WebSocket =
      originalWebSocket;
  });

  it("connects with default URL", () => {
    const client =
      new HyperliquidWebSocketClient();

    client.connect();

    expect(getWs().url).toBe(
      "wss://api.hyperliquid.xyz/ws",
    );
  });

  it("parses allMids messages and delivers to handlers", () => {
    const client =
      new HyperliquidWebSocketClient();

    let received: WsMessage | null = null;

    client.onMessage((msg) => {
      received = msg;
    });

    client.connect();
    getWs().triggerOpen();

    getWs().triggerMessage(
      JSON.stringify({
        channel: "allMids",
        data: {
          mid: { BTC: "61000" },
        },
      }),
    );

    expect(received).toEqual({
      channel: "allMids",
      data: {
        mid: { BTC: "61000" },
      },
    });
  });

  it("parses l2Book messages", () => {
    const client =
      new HyperliquidWebSocketClient();

    let received: WsMessage | null = null;

    client.onMessage((msg) => {
      received = msg;
    });

    client.connect();
    getWs().triggerOpen();

    getWs().triggerMessage(
      JSON.stringify({
        channel: "l2Book",
        data: {
          coin: "BTC",
          levels: [
            { price: "60010", sz: "1" },
            { price: "59990", sz: "1" },
          ],
          time: 1000,
        },
      }),
    );

    expect(received).toMatchObject({
      channel: "l2Book",
    });
  });

  it("ignores unparseable messages", () => {
    const client =
      new HyperliquidWebSocketClient();

    const handler = vi.fn();

    client.onMessage(handler);

    client.connect();
    getWs().triggerOpen();

    getWs().triggerMessage(
      "not json",
    );

    expect(handler).not.toHaveBeenCalled();
  });

  it("sends subscribe message when socket opens", () => {
    const client =
      new HyperliquidWebSocketClient();

    client.subscribe("allMids");
    client.connect();
    getWs().triggerOpen();

    expect(
      getWs().send,
    ).toHaveBeenCalledWith(
      JSON.stringify({
        method: "subscribe",
        subscription: {
          type: "allMids",
        },
      }),
    );
  });

  it("unsubscribe sends correct message", () => {
    const client =
      new HyperliquidWebSocketClient();

    client.subscribe("allMids");
    client.connect();
    getWs().triggerOpen();

    getWs().send.mockClear();

    client.unsubscribe("allMids");

    expect(
      getWs().send,
    ).toHaveBeenCalledWith(
      JSON.stringify({
        method: "unsubscribe",
        subscription: {
          type: "allMids",
        },
      }),
    );
  });

  it("removes handler via returned unsubscribe fn", () => {
    const client =
      new HyperliquidWebSocketClient();

    const handler = vi.fn();
    const off = client.onMessage(handler);

    client.connect();
    getWs().triggerOpen();

    off();

    getWs().triggerMessage(
      JSON.stringify({
        channel: "allMids",
        data: {
          mid: { BTC: "61000" },
        },
      }),
    );

    expect(handler).not.toHaveBeenCalled();
  });

  it("disconnect closes websocket", () => {
    const client =
      new HyperliquidWebSocketClient();

    client.connect();
    getWs().triggerOpen();

    client.disconnect();

    expect(
      getWs().close,
    ).toHaveBeenCalled();
    expect(client.readyState).toBe(3);
  });

  it("resubscribes on reconnect", async () => {
    const client =
      new HyperliquidWebSocketClient({
        reconnectDelayMs: 0,
      });

    client.connect();
    client.subscribe("allMids");
    getWs().triggerOpen();

    expect(
      getWs().send,
    ).toHaveBeenCalledWith(
      JSON.stringify({
        method: "subscribe",
        subscription: {
          type: "allMids",
        },
      }),
    );

    getWs().send.mockClear();

    getWs().triggerClose();

    await new Promise(
      (resolve) =>
        setTimeout(resolve, 50),
    );

    expect(
      MockWebSocket.instances,
    ).toHaveLength(2);

    const newWs =
      MockWebSocket.instances[1]!;

    newWs.triggerOpen();

    expect(
      newWs.send,
    ).toHaveBeenCalledWith(
      JSON.stringify({
        method: "subscribe",
        subscription: {
          type: "allMids",
        },
      }),
    );

    client.disconnect();
  });
});
