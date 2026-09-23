import { describe, expect, it } from "vitest";
import { config } from "../index.js";

describe("config foundation", () => {
  it("reads the current node environment", () => {
    expect(config.nodeEnv).toBe("test");
  });
});
