import { afterEach, describe, expect, it, vi } from "vitest";
import { HttpTransport } from "../transport/http-transport.js";
import { HyperliquidError } from "../errors/hyperliquid-error.js";

describe("HttpTransport", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("posts JSON and parses the response", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      }),
    );

    const transport = new HttpTransport({
      baseUrl: "https://example.com/",
    });

    const result = await transport.post<{ ok: boolean }>("/info", {
      type: "meta",
    });

    expect(result).toEqual({ ok: true });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.com/info",
      expect.objectContaining({
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ type: "meta" }),
      }),
    );
  });

  it("throws HyperliquidError on HTTP failure", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "bad request" }), {
        status: 400,
      }),
    );

    const transport = new HttpTransport({
      baseUrl: "https://example.com",
    });

    await expect(
      transport.post("/info", { type: "invalid" }),
    ).rejects.toMatchObject({
      name: "HyperliquidError",
      status: 400,
    });
  });

  it("throws HyperliquidError on timeout", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(
      async (_input, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            const error = new Error("aborted");
            error.name = "AbortError";
            reject(error);
          });
        }),
    );

    const transport = new HttpTransport({
      baseUrl: "https://example.com",
      timeoutMs: 10,
    });

    await expect(
      transport.post("/info", { type: "meta" }),
    ).rejects.toBeInstanceOf(HyperliquidError);
  });
});
