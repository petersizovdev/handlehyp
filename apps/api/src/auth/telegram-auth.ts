import crypto from "node:crypto";

export interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

export interface TelegramAuthResult {
  user: TelegramUser;
  authDate: number;
}

function parseInitData(initData: string): URLSearchParams {
  return new URLSearchParams(initData);
}

function buildDataCheckString(params: URLSearchParams): string {
  return [...params.entries()]
    .filter(([key]) => key !== "hash")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
}

export function verifyTelegramInitData(
  initData: string,
  botToken: string,
  maxAgeSeconds = 86_400,
): TelegramAuthResult {
  const params = parseInitData(initData);

  const receivedHash = params.get("hash");
  const authDateRaw = params.get("auth_date");
  const userRaw = params.get("user");

  if (!receivedHash || !authDateRaw || !userRaw) {
    throw new Error("Invalid Telegram init data");
  }

  const authDate = Number(authDateRaw);

  if (!Number.isInteger(authDate) || authDate <= 0) {
    throw new Error("Invalid Telegram auth date");
  }

  const now = Math.floor(Date.now() / 1000);

  if (now - authDate > maxAgeSeconds || authDate > now + 60) {
    throw new Error("Telegram auth data expired");
  }

  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();

  const dataCheckString = buildDataCheckString(params);

  const calculatedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  const received = Buffer.from(receivedHash, "hex");
  const calculated = Buffer.from(calculatedHash, "hex");

  if (
    received.length !== calculated.length ||
    !crypto.timingSafeEqual(received, calculated)
  ) {
    throw new Error("Invalid Telegram signature");
  }

  let user: TelegramUser;

  try {
    user = JSON.parse(userRaw) as TelegramUser;
  } catch {
    throw new Error("Invalid Telegram user payload");
  }

  if (!Number.isSafeInteger(user.id) || user.id <= 0) {
    throw new Error("Invalid Telegram user");
  }

  return {
    user,
    authDate,
  };
}
