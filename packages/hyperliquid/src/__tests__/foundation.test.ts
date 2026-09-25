import { describe, expect, it } from "vitest";
import { HYPERLIQUID_PACKAGE } from "../index.js";

describe("hyperliquid package", () => {
  it("has the expected package identity", () => {
    expect(HYPERLIQUID_PACKAGE).toBe("@handlehyp/hyperliquid");
  });
});
