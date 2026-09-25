const WALLET_ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;
export function createBuilderCodeConfig(builderAddress, maxFeeRate) {
    const normalizedAddress = builderAddress.trim();
    if (!WALLET_ADDRESS_PATTERN.test(normalizedAddress)) {
        throw new Error("Invalid builder address");
    }
    if (!Number.isInteger(maxFeeRate) ||
        maxFeeRate <= 0 ||
        maxFeeRate > 100) {
        throw new Error("Invalid builder fee rate: expected integer from 1 to 100 decibps");
    }
    return {
        builderAddress: normalizedAddress,
        maxFeeRate,
    };
}
export function createOrderExecutionRequest(order, builder) {
    if (!WALLET_ADDRESS_PATTERN.test(builder.builderAddress)) {
        throw new Error("Invalid builder address");
    }
    if (!Number.isInteger(builder.maxFeeRate) ||
        builder.maxFeeRate <= 0 ||
        builder.maxFeeRate > 100) {
        throw new Error("Invalid builder fee rate");
    }
    return {
        order,
        builder,
    };
}
//# sourceMappingURL=builder-code.js.map