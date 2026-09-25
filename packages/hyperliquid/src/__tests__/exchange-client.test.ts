import { describe, expect, it, vi } from "vitest";

import { HyperliquidExchangeClient } from "../client/exchange-client.js";

describe("HyperliquidExchangeClient", () => {
  it("creates a builder fee approval action", () => {
    const client = new HyperliquidExchangeClient();

    expect(
      client.createBuilderFeeApprovalAction(
        "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
        10,
      ),
    ).toEqual({
      type: "approveBuilderFee",
      builder: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
      maxFeeRate: 10,
    });
  });

  it("loads the maximum approved builder fee", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            maxFeeRate: 10,
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json",
            },
          },
        ),
      );

    const client = new HyperliquidExchangeClient();

    const result = await client.maxBuilderFee(
      "0x1234567890123456789012345678901234567890",
      "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
    );

    expect(result).toEqual({
      maxFeeRate: 10,
    });

    expect(fetchMock).toHaveBeenCalledOnce();

    fetchMock.mockRestore();
  });
});
