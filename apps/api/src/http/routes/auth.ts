import type { FastifyInstance } from "fastify";

import {
  verifyTelegramInitData,
} from "../../auth/telegram-auth.js";
import {
  telegramAuthRequestSchema,
  telegramAuthResponseSchema,
} from "../schemas/auth.js";

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post("/auth/telegram", async (request, reply) => {
    const parsedRequest = telegramAuthRequestSchema.safeParse(request.body);

    if (!parsedRequest.success) {
      return reply.status(400).send({
        error: "INVALID_REQUEST",
        message: "Invalid Telegram auth request",
      });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      app.log.error("TELEGRAM_BOT_TOKEN is not configured");

      return reply.status(503).send({
        error: "AUTH_NOT_CONFIGURED",
        message: "Telegram authentication is not configured",
      });
    }

    try {
      const result = verifyTelegramInitData(
        parsedRequest.data.initData,
        botToken,
      );

      return reply
        .status(200)
        .send(telegramAuthResponseSchema.parse(result));
    } catch (error) {
      app.log.warn(error, "Telegram authentication failed");

      return reply.status(401).send({
        error: "INVALID_TELEGRAM_AUTH",
        message: "Invalid Telegram authentication data",
      });
    }
  });
}
