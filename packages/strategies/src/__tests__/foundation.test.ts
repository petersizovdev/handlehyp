import { describe, expect, it } from "vitest";
import { STRATEGIES_PACKAGE } from "../index.js";

describe("strategies package", () => {
  it("has the expected package identity", () => {
    expect(STRATEGIES_PACKAGE).toBe(
      "@handlehyp/strategies",
    );
  });
});
