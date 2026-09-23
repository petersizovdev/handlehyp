import { describe, expect, it } from "vitest";
import { TELEGRAM_PACKAGE } from "../index.js";

describe("telegram package", () => {
  it("has the expected package identity", () => {
    expect(TELEGRAM_PACKAGE).toBe("@handlehyp/telegram");
  });
});
