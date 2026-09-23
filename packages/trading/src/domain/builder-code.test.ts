import { describe, expect, it } from "vitest";

import {
  createBuilderCodeConfig,
  createOrderExecutionRequest,
} from "./builder-code.js";
import { normalizeOrderIntent } from "./validation.js";

const account = {
  telegramUserId: 123456789,
  walletAddress: "0x1234567890123456789012345678901234567890",
};

const order = normalizeOrderIntent({
  account,
  coin: "BTC",
  side: "buy",
  type: "market",
  size: "0.01",
});

const builderAddress =
  "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd";

describe("builder code", () => {
  it("creates a valid builder config", () => {
    expect(
      createBuilderCodeConfig(builderAddress, 10),
    ).toEqual({
      builderAddress,
      maxFeeRate: 10,
    });
  });

  it("accepts the maximum allowed perp builder fee", () => {
    expect(
      createBuilderCodeConfig(builderAddress, 100),
    ).toEqual({
      builderAddress,
      maxFeeRate: 100,
    });
  });

  it("rejects an invalid builder address", () => {
    expect(() =>
      createBuilderCodeConfig("HANDLEHYP", 10),
    ).toThrow("Invalid builder address");
  });

  it("rejects a fractional builder fee", () => {
    expect(() =>
      createBuilderCodeConfig(builderAddress, 1.5),
    ).toThrow("Invalid builder fee rate");
  });

  it("rejects a zero builder fee", () => {
    expect(() =>
      createBuilderCodeConfig(builderAddress, 0),
    ).toThrow("Invalid builder fee rate");
  });

  it("rejects a builder fee above the Hyperliquid perp limit", () => {
    expect(() =>
      createBuilderCodeConfig(builderAddress, 101),
    ).toThrow("Invalid builder fee rate");
  });

  it("attaches builder config to an execution request", () => {
    const builder = createBuilderCodeConfig(
      builderAddress,
      10,
    );

    expect(
      createOrderExecutionRequest(order, builder),
    ).toEqual({
      order,
      builder,
    });
  });
});
