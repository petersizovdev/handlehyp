import crypto from "node:crypto";

import Fastify from "fastify";
import { describe, expect, it, vi } from "vitest";

import { authMeRoutes } from "./auth-me.js";

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

describe("GET /auth/me", () => {
  const botToken = "123456789:TEST_TOKEN";

  it("returns the authenticated Telegram user", async () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", botToken);

    const user = {
      id: 123456789,
      first_name: "Test",
      username: "test_user",
    };

    const app = Fastify();

    await app.register(authMeRoutes);

    const response = await app.inject({
      method: "GET",
      url: "/auth/me",
      headers: {
        authorization: `tma ${createInitData(botToken, user)}`,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      user,
    });

    await app.close();
    vi.unstubAllEnvs();
  });

  it("rejects a request without Telegram auth", async () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", botToken);

    const app = Fastify();

    await app.register(authMeRoutes);

    const response = await app.inject({
      method: "GET",
      url: "/auth/me",
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      error: "TELEGRAM_AUTH_REQUIRED",
      message: "Telegram authentication is required",
    });

    await app.close();
    vi.unstubAllEnvs();
  });

  it("rejects invalid Telegram auth", async () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", botToken);

    const app = Fastify();

    await app.register(authMeRoutes);

    const response = await app.inject({
      method: "GET",
      url: "/auth/me",
      headers: {
        authorization: "tma invalid",
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

  it("returns 503 when Telegram auth is not configured", async () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", undefined);

    const app = Fastify();

    await app.register(authMeRoutes);

    const response = await app.inject({
      method: "GET",
      url: "/auth/me",
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
