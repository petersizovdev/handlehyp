import type { TelegramUser } from "./telegram-auth.js";

declare module "fastify" {
  interface FastifyRequest {
    telegramUser?: TelegramUser;
  }
}
