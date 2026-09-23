import { describe, expect, it } from "vitest";
import { TRADING_PACKAGE } from "../index.js";

describe("trading package", () => {
  it("has the expected package identity", () => {
    expect(TRADING_PACKAGE).toBe("@handlehyp/trading");
  });
});
