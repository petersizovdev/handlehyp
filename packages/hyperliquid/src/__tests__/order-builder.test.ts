import { describe, expect, it } from "vitest";

import { buildHyperliquidOrderAction } from "../client/order-builder.js";

describe("buildHyperliquidOrderAction", () => {
  it("builds a basic limit buy order", () => {
    expect(
      buildHyperliquidOrderAction({
        asset: 0,
        isBuy: true,
        size: "0.0100",
        price: "95000.0000",
      }),
    ).toEqual({
      type: "order",
      orders: [
        {
          a: 0,
          b: true,
          p: "95000",
          s: "0.01",
          r: false,
          t: {
            limit: {
              tif: "Gtc",
            },
          },
        },
      ],
      grouping: "na",
    });
  });

  it("builds a sell order with reduce-only", () => {
    expect(
      buildHyperliquidOrderAction({
        asset: 1,
        isBuy: false,
        size: "2.500",
        price: "3000",
        reduceOnly: true,
      }),
    ).toEqual({
      type: "order",
      orders: [
        {
          a: 1,
          b: false,
          p: "3000",
          s: "2.5",
          r: true,
          t: {
            limit: {
              tif: "Gtc",
            },
          },
        },
      ],
      grouping: "na",
    });
  });

  it("builds IOC and ALO orders", () => {
    expect(
      buildHyperliquidOrderAction({
        asset: 0,
        isBuy: true,
        size: "0.01",
        price: "95000",
        tif: "Ioc",
      }).orders[0]!.t,
    ).toEqual({
      limit: {
        tif: "Ioc",
      },
    });

    expect(
      buildHyperliquidOrderAction({
        asset: 0,
        isBuy: true,
        size: "0.01",
        price: "95000",
        tif: "Alo",
      }).orders[0]!.t,
    ).toEqual({
      limit: {
        tif: "Alo",
      },
    });
  });

  it("attaches Builder Code to the action", () => {
    expect(
      buildHyperliquidOrderAction({
        asset: 0,
        isBuy: true,
        size: "0.01",
        price: "95000",
        builder: {
          b: "0x14791697260E4c9A71f18484C9f997B308e59325",
          f: 10,
        },
      }),
    ).toEqual({
      type: "order",
      orders: [
        {
          a: 0,
          b: true,
          p: "95000",
          s: "0.01",
          r: false,
          t: {
            limit: {
              tif: "Gtc",
            },
          },
        },
      ],
      grouping: "na",
      builder: {
        b: "0x14791697260E4c9A71f18484C9f997B308e59325",
        f: 10,
      },
    });
  });

  it("normalizes a client order id", () => {
    expect(
      buildHyperliquidOrderAction({
        asset: 0,
        isBuy: true,
        size: "1",
        price: "100",
        cloid: "0xABCDEFABCDEFABCDEFABCDEFABCDEFAB",
      }).orders[0]!.c,
    ).toBe("0xabcdefabcdefabcdefabcdefabcdefab");
  });

  it("rejects invalid order values", () => {
    expect(() =>
      buildHyperliquidOrderAction({
        asset: -1,
        isBuy: true,
        size: "1",
        price: "100",
      }),
    ).toThrow("Invalid Hyperliquid asset index");

    expect(() =>
      buildHyperliquidOrderAction({
        asset: 0,
        isBuy: true,
        size: "0",
        price: "100",
      }),
    ).toThrow("order size must be positive");

    expect(() =>
      buildHyperliquidOrderAction({
        asset: 0,
        isBuy: true,
        size: "1",
        price: "0",
      }),
    ).toThrow("order price must be positive");
  });

  it("rejects invalid Builder Code", () => {
    expect(() =>
      buildHyperliquidOrderAction({
        asset: 0,
        isBuy: true,
        size: "1",
        price: "100",
        builder: {
          b: "0x1234",
          f: 10,
        },
      }),
    ).toThrow("Invalid builder address");

    expect(() =>
      buildHyperliquidOrderAction({
        asset: 0,
        isBuy: true,
        size: "1",
        price: "100",
        builder: {
          b: "0x14791697260E4c9A71f18484C9f997B308e59325",
          f: 101,
        },
      }),
    ).toThrow("Invalid builder fee rate");
  });
});
