import { describe, expect, it, vi, afterEach } from "vitest";
import { HyperliquidInfoClient } from "../client/info-client.js";

describe("HyperliquidInfoClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("requests perpetual metadata", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          universe: [
            {
              name: "BTC",
              szDecimals: 5,
              maxLeverage: 40,
            },
          ],
          marginTables: [],
        }),
        { status: 200 },
      ),
    );

    const client = new HyperliquidInfoClient({
      baseUrl: "https://example.com",
    });

    const result = await client.meta();

    expect(result.universe[0]).toMatchObject({
      name: "BTC",
      szDecimals: 5,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("requests live perpetual asset contexts", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            universe: [
              {
                name: "BTC",
                szDecimals: 5,
              },
            ],
          },
          [
            {
              funding: "0.0001",
              openInterest: "123.45",
              prevDayPx: "100000",
              dayNtlVlm: "1234567",
              oraclePx: "100100",
              markPx: "100050",
              midPx: "100040",
            },
          ],
        ]),
        { status: 200 },
      ),
    );

    const client = new HyperliquidInfoClient({
      baseUrl: "https://example.com",
    });

    const [meta, contexts] = await client.metaAndAssetCtxs();

    expect(meta.universe[0]?.name).toBe("BTC");
    expect(contexts[0]).toMatchObject({
      funding: "0.0001",
      openInterest: "123.45",
      markPx: "100050",
      oraclePx: "100100",
    });
  });
});
