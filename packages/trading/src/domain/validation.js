const WALLET_ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;
const COIN_PATTERN = /^[A-Z0-9._-]+$/;
function isPositiveDecimal(value) {
    if (!/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value)) {
        return false;
    }
    return Number(value) > 0 && Number.isFinite(Number(value));
}
export function normalizeOrderIntent(intent) {
    if (!Number.isSafeInteger(intent.account.telegramUserId)) {
        throw new Error("Invalid Telegram user id");
    }
    if (!WALLET_ADDRESS_PATTERN.test(intent.account.walletAddress)) {
        throw new Error("Invalid Hyperliquid wallet address");
    }
    const coin = intent.coin.toUpperCase();
    if (!COIN_PATTERN.test(coin)) {
        throw new Error("Invalid trading coin");
    }
    if (!isPositiveDecimal(intent.size)) {
        throw new Error("Invalid order size");
    }
    if (intent.type === "limit") {
        if (!intent.limitPrice || !isPositiveDecimal(intent.limitPrice)) {
            throw new Error("Limit orders require a positive limit price");
        }
    }
    if (intent.type === "market" && intent.limitPrice !== undefined) {
        throw new Error("Market orders cannot contain a limit price");
    }
    return {
        ...intent,
        coin,
        reduceOnly: intent.reduceOnly ?? false,
    };
}
//# sourceMappingURL=validation.js.map