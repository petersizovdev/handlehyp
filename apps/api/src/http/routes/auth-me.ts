import type { FastifyInstance } from "fastify";

import { requireTelegramAuth } from "../../auth/telegram-hook.js";

export async function authMeRoutes(
  app: FastifyInstance,
): Promise<void> {
  app.get(
    "/auth/me",
    {
      preHandler: requireTelegramAuth,
    },
    async (request) => ({
      user: request.telegramUser,
    }),
  );
}
