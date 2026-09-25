import { describe, expect, it } from "vitest";
import { MarketStateTracker } from "../../services/market-state.js";

function allMids(
  mid: Record<string, string>,
) {
  return {
    channel: "allMids" as const,
    data: { mid },
  };
}

function l2Book(
  coin: string,
  levels: Array<{
    price: string;
    sz: string;
  }>,
  time = 1_000,
) {
  return {
    channel: "l2Book" as const,
    data: {
      coin,
      levels,
      time,
    },
  };
}

describe("MarketStateTracker", () => {
  it("updates mid price from allMids", async () => {
    const tracker = new MarketStateTracker();

    tracker.update(allMids({ BTC: "61000" }));

    const snap = await tracker.getMarketSnapshot("BTC");

    expect(snap.midPrice).toBe("61000");
    expect(snap.bestBid).toBe("61000");
    expect(snap.bestAsk).toBe("61000");
  });

  it("updates order book from l2Book", async () => {
    const tracker = new MarketStateTracker();

    tracker.update(
      l2Book("BTC", [
        { price: "60050", sz: "1" },
        { price: "60040", sz: "2" },
        { price: "59990", sz: "1" },
        { price: "59980", sz: "1" },
      ]),
    );

    const snap = await tracker.getMarketSnapshot("BTC");

    expect(snap.bestBid).toBe("60050");
    expect(snap.bestAsk).toBe("59980");
    expect(snap.bidLevels[0]?.price).toBe(
      "60050",
    );
    expect(snap.askLevels[0]?.price).toBe(
      "59980",
    );
  });

  it("preserves mid price when only l2Book updates", async () => {
    const tracker = new MarketStateTracker();

    tracker.update(allMids({ BTC: "60000" }));
    tracker.update(
      l2Book("BTC", [
        { price: "60010", sz: "1" },
        { price: "59990", sz: "1" },
      ]),
    );

    const snap =
      await tracker.getMarketSnapshot("BTC");

    expect(snap.midPrice).toBe("60000");
    expect(snap.bestBid).toBe("60010");
    expect(snap.bestAsk).toBe("59990");
  });

  it("computes mid price from bid/ask when no prior mid", async () => {
    const tracker = new MarketStateTracker();

    tracker.update(
      l2Book("BTC", [
        { price: "60010", sz: "1" },
        { price: "59990", sz: "1" },
      ]),
    );

    const snap =
      await tracker.getMarketSnapshot("BTC");

    expect(snap.midPrice).toBe("60000");
  });

  it("normalizes coin names to uppercase", async () => {
    const tracker = new MarketStateTracker();

    tracker.update(allMids({ btc: "61000" }));

    expect(tracker.hasMarket("BTC")).toBe(true);
    expect(tracker.hasMarket("btc")).toBe(true);
    expect(tracker.hasMarket("ETH")).toBe(false);
  });

  it("stores multiple coins", async () => {
    const tracker = new MarketStateTracker();

    tracker.update(
      allMids({ BTC: "61000", ETH: "3000" }),
    );

    expect(tracker.getAllCoins()).toContain(
      "BTC",
    );
    expect(tracker.getAllCoins()).toContain(
      "ETH",
    );
  });

  it("throws when market not found", async () => {
    const tracker = new MarketStateTracker();

    await expect(
      tracker.getMarketSnapshot("BTC"),
    ).rejects.toThrow(
      "No market data available for BTC",
    );
  });

  it("ignores allMids with empty mid data", () => {
    const tracker = new MarketStateTracker();

    tracker.update(
      allMids({}),
    );

    expect(
      tracker.getAllCoins(),
    ).toHaveLength(0);
  });
});
