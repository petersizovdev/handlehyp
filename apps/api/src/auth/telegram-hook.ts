import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { verifyTelegramInitData } from "./telegram-auth.js";

export async function requireTelegramAuth(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    request.log.error("TELEGRAM_BOT_TOKEN is not configured");

    await reply.status(503).send({
      error: "AUTH_NOT_CONFIGURED",
      message: "Telegram authentication is not configured",
    });

    return;
  }

  const authorization = request.headers.authorization;

  if (!authorization?.startsWith("tma ")) {
    await reply.status(401).send({
      error: "TELEGRAM_AUTH_REQUIRED",
      message: "Telegram authentication is required",
    });

    return;
  }

  const initData = authorization.slice(4).trim();

  if (!initData) {
    await reply.status(401).send({
      error: "TELEGRAM_AUTH_REQUIRED",
      message: "Telegram authentication is required",
    });

    return;
  }

  try {
    const result = verifyTelegramInitData(initData, botToken);

    request.telegramUser = result.user;
  } catch (error) {
    request.log.warn(error, "Telegram authentication failed");

    await reply.status(401).send({
      error: "INVALID_TELEGRAM_AUTH",
      message: "Invalid Telegram authentication data",
    });
  }
}
