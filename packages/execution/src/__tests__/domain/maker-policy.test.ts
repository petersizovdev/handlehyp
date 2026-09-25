import { describe, expect, it } from "vitest";
import { createMakerPolicy } from "../../domain/maker-policy.js";

describe("createMakerPolicy", () => {
  it("applies defaults", () => {
    const policy = createMakerPolicy();

    expect(policy).toEqual({
      postOnly: true,
      priceReference: "mid",
      spreadBps: 0,
    });
  });

  it("accepts overrides", () => {
    const policy = createMakerPolicy({
      postOnly: true,
      priceReference: "best_bid_ask",
      spreadBps: 100,
    });

    expect(policy).toEqual({
      postOnly: true,
      priceReference: "best_bid_ask",
      spreadBps: 100,
    });
  });

  it("throws on negative spreadBps", () => {
    expect(() =>
      createMakerPolicy({ spreadBps: -1 }),
    ).toThrow("Invalid spreadBps");
  });

  it("throws on non-integer spreadBps", () => {
    expect(() =>
      createMakerPolicy({ spreadBps: 1.5 }),
    ).toThrow("Invalid spreadBps");
  });
});
