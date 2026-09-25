import { describe, expect, it } from "vitest";
import { HANDLEHYP_VERSION } from "../index.js";

describe("shared foundation", () => {
  it("exposes the HandleHYP version", () => {
    expect(HANDLEHYP_VERSION).toBe("0.1.0");
  });
});
