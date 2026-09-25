import crypto from "node:crypto";

import { describe, expect, it } from "vitest";

import { verifyTelegramInitData } from "./telegram-auth.js";

function createInitData(
  botToken: string,
  user: object,
  authDate = Math.floor(Date.now() / 1000),
): string {
  const params = new URLSearchParams();

  params.set("auth_date", String(authDate));
  params.set("query_id", "AAHdF6IQAAAAAN0XohDhrOrc");
  params.set("user", JSON.stringify(user));

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();

  const hash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  params.set("hash", hash);

  return params.toString();
}

describe("verifyTelegramInitData", () => {
  const botToken = "123456789:TEST_TOKEN";

  const user = {
    id: 123456789,
    first_name: "Test",
    username: "test_user",
    language_code: "ru",
  };

  it("accepts valid Telegram init data", () => {
    const initData = createInitData(botToken, user);

    expect(verifyTelegramInitData(initData, botToken)).toEqual({
      user,
      authDate: expect.any(Number),
    });
  });

  it("rejects invalid signature", () => {
    const initData = createInitData(botToken, user);
    const params = new URLSearchParams(initData);

    params.set("hash", "00".repeat(32));

    expect(() =>
      verifyTelegramInitData(params.toString(), botToken),
    ).toThrow("Invalid Telegram signature");
  });

  it("rejects expired auth data", () => {
    const oldAuthDate = Math.floor(Date.now() / 1000) - 86_401;
    const initData = createInitData(botToken, user, oldAuthDate);

    expect(() =>
      verifyTelegramInitData(initData, botToken),
    ).toThrow("Telegram auth data expired");
  });

  it("rejects missing required fields", () => {
    expect(() =>
      verifyTelegramInitData(
        "auth_date=123&user=%7B%22id%22%3A1%7D",
        botToken,
      ),
    ).toThrow("Invalid Telegram init data");
  });
});
