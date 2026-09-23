import { describe, expect, it } from "vitest";
import type { Hex } from "viem";

import { HyperliquidL1Signer } from "../signing/l1-signer.js";

const TEST_PRIVATE_KEY =
  "0x0123456789012345678901234567890123456789012345678901234567890123" as Hex;

describe("HyperliquidL1Signer", () => {
  it("matches Hyperliquid mainnet L1 signing vector", async () => {
    const signer = new HyperliquidL1Signer({
      privateKey: TEST_PRIVATE_KEY,
      isMainnet: true,
    });

    const signature = await signer.signL1Action(
      {
        type: "dummy",
        num: 100_000_000_000,
      },
      0,
    );

    expect(signature).toEqual({
      r: "0x053749d5b30552aeb2fca34b530185976545bb22d0b3ce6f62e31be961a59298",
      s: "0x755c40ba9bf05223521753995abb2f73ab3229be8ec921f350cb447e384d8ed8",
      v: 27,
    });
  });

  it("matches Hyperliquid testnet L1 signing vector", async () => {
    const signer = new HyperliquidL1Signer({
      privateKey: TEST_PRIVATE_KEY,
      isMainnet: false,
    });

    const signature = await signer.signL1Action(
      {
        type: "dummy",
        num: 100_000_000_000,
      },
      0,
    );

    expect(signature).toEqual({
      r: "0x542af61ef1f429707e3c76c5293c80d01f74ef853e34b76efffcb57e574f9510",
      s: "0x17b8b32f086e8cdede991f1e2c529f5dd5297cbe8128500e00cbaf766204a613",
      v: 28,
    });
  });

  it("derives the expected wallet address", () => {
    const signer = new HyperliquidL1Signer({
      privateKey: TEST_PRIVATE_KEY,
    });

    expect(signer.getAddress()).toBe(
      "0x14791697260E4c9A71f18484C9f997B308e59325",
    );
  });
});
