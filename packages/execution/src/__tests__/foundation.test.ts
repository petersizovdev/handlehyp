import { describe, expect, it } from "vitest";
import { EXECUTION_PACKAGE } from "../index.js";

describe("execution package", () => {
  it("has the expected package identity", () => {
    expect(EXECUTION_PACKAGE).toBe("@handlehyp/execution");
  });
});
