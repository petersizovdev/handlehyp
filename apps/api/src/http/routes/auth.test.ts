import crypto from "node:crypto";

import Fastify from "fastify";
import { describe, expect, it, vi } from "vitest";

import { authRoutes } from "./auth.js";

function createInitData(
  botToken: string,
  user: object,
): string {
  const authDate = Math.floor(Date.now() / 1000);

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

describe("POST /auth/telegram", () => {
  const botToken = "123456789:TEST_TOKEN";

  it("authenticates a valid Telegram user", async () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", botToken);

    const user = {
      id: 123456789,
      first_name: "Test",
      username: "test_user",
    };

    const app = Fastify();

    await app.register(authRoutes);

    const response = await app.inject({
      method: "POST",
      url: "/auth/telegram",
      payload: {
        initData: createInitData(botToken, user),
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      user,
      authDate: expect.any(Number),
    });

    await app.close();
    vi.unstubAllEnvs();
  });

  it("rejects invalid Telegram auth data", async () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", botToken);

    const app = Fastify();

    await app.register(authRoutes);

    const response = await app.inject({
      method: "POST",
      url: "/auth/telegram",
      payload: {
        initData: "invalid",
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      error: "INVALID_TELEGRAM_AUTH",
      message: "Invalid Telegram authentication data",
    });

    await app.close();
    vi.unstubAllEnvs();
  });

  it("returns 400 for an invalid request body", async () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", botToken);

    const app = Fastify();

    await app.register(authRoutes);

    const response = await app.inject({
      method: "POST",
      url: "/auth/telegram",
      payload: {},
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: "INVALID_REQUEST",
      message: "Invalid Telegram auth request",
    });

    await app.close();
    vi.unstubAllEnvs();
  });

  it("returns 503 when Telegram auth is not configured", async () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", undefined);

    const app = Fastify();

    await app.register(authRoutes);

    const response = await app.inject({
      method: "POST",
      url: "/auth/telegram",
      payload: {
        initData: "anything",
      },
    });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({
      error: "AUTH_NOT_CONFIGURED",
      message: "Telegram authentication is not configured",
    });

    await app.close();
    vi.unstubAllEnvs();
  });
});
