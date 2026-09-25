import { describe, expect, it } from "vitest";

import { normalizeOrderIntent } from "./validation.js";

const account = {
  telegramUserId: 123456789,
  walletAddress: "0x1234567890123456789012345678901234567890",
};

describe("normalizeOrderIntent", () => {
  it("normalizes a valid market order", () => {
    expect(
      normalizeOrderIntent({
        account,
        coin: "btc",
        side: "buy",
        type: "market",
        size: "0.01",
      }),
    ).toEqual({
      account,
      coin: "BTC",
      side: "buy",
      type: "market",
      size: "0.01",
      reduceOnly: false,
    });
  });

  it("accepts a valid limit order", () => {
    expect(
      normalizeOrderIntent({
        account,
        coin: "ETH",
        side: "sell",
        type: "limit",
        size: "1.5",
        limitPrice: "4000.25",
        reduceOnly: true,
      }),
    ).toEqual({
      account,
      coin: "ETH",
      side: "sell",
      type: "limit",
      size: "1.5",
      limitPrice: "4000.25",
      reduceOnly: true,
    });
  });

  it("rejects an invalid wallet address", () => {
    expect(() =>
      normalizeOrderIntent({
        account: {
          ...account,
          walletAddress: "invalid",
        },
        coin: "BTC",
        side: "buy",
        type: "market",
        size: "1",
      }),
    ).toThrow("Invalid Hyperliquid wallet address");
  });

  it("rejects a non-positive size", () => {
    expect(() =>
      normalizeOrderIntent({
        account,
        coin: "BTC",
        side: "buy",
        type: "market",
        size: "0",
      }),
    ).toThrow("Invalid order size");
  });

  it("requires a price for limit orders", () => {
    expect(() =>
      normalizeOrderIntent({
        account,
        coin: "BTC",
        side: "buy",
        type: "limit",
        size: "1",
      }),
    ).toThrow("Limit orders require a positive limit price");
  });

  it("rejects a price on market orders", () => {
    expect(() =>
      normalizeOrderIntent({
        account,
        coin: "BTC",
        side: "buy",
        type: "market",
        size: "1",
        limitPrice: "60000",
      }),
    ).toThrow("Market orders cannot contain a limit price");
  });
});
