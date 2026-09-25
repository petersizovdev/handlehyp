import { describe, expect, it } from "vitest";
import { UI_PACKAGE } from "../index.js";

describe("ui package", () => {
  it("has the expected package identity", () => {
    expect(UI_PACKAGE).toBe("@handlehyp/ui");
  });
});
