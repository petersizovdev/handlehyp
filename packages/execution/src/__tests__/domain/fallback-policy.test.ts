import { describe, expect, it } from "vitest";
import { createFallbackPolicy } from "../../domain/fallback-policy.js";

describe("createFallbackPolicy", () => {
  it("applies defaults", () => {
    const policy = createFallbackPolicy();

    expect(policy).toEqual({
      enabled: true,
      timeoutMs: 10_000,
      slippageBps: 100,
    });
  });

  it("accepts overrides", () => {
    const policy = createFallbackPolicy({
      enabled: false,
      timeoutMs: 5_000,
      slippageBps: 200,
    });

    expect(policy).toEqual({
      enabled: false,
      timeoutMs: 5_000,
      slippageBps: 200,
    });
  });

  it("throws on zero timeoutMs", () => {
    expect(() =>
      createFallbackPolicy({ timeoutMs: 0 }),
    ).toThrow("Invalid timeoutMs");
  });

  it("throws on negative timeoutMs", () => {
    expect(() =>
      createFallbackPolicy({ timeoutMs: -1 }),
    ).toThrow("Invalid timeoutMs");
  });

  it("throws on negative slippageBps", () => {
    expect(() =>
      createFallbackPolicy({ slippageBps: -1 }),
    ).toThrow("Invalid slippageBps");
  });

  it("throws on non-integer slippageBps", () => {
    expect(() =>
      createFallbackPolicy({ slippageBps: 1.5 }),
    ).toThrow("Invalid slippageBps");
  });
});
