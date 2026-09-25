import { z } from "zod";

export const telegramAuthRequestSchema = z.object({
  initData: z.string().min(1),
});

export const telegramAuthResponseSchema = z.object({
  user: z.object({
    id: z.number().int().positive(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    username: z.string().optional(),
    language_code: z.string().optional(),
    is_premium: z.boolean().optional(),
  }),
  authDate: z.number().int().positive(),
});

export type TelegramAuthRequest = z.infer<
  typeof telegramAuthRequestSchema
>;
