import { describe, expect, it, vi } from "vitest";

import { HyperliquidExchangeExecutor } from "../client/exchange-executor.js";
import type { ExchangeSigner } from "../signing/exchange-signer.js";

describe("HyperliquidExchangeExecutor", () => {
  it("signs the action before sending it", async () => {
    const signer: ExchangeSigner = {
      signExchangeAction: vi.fn().mockResolvedValue({
        r: "r",
        s: "s",
        v: 27,
      }),
    };

    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            status: "ok",
            response: {
              type: "order",
            },
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json",
            },
          },
        ),
      );

    const executor = new HyperliquidExchangeExecutor({
      signer,
    });

    const action = {
      type: "order",
      orders: [],
      grouping: "na",
    };

    const result = await executor.execute(action, 123456789);

    expect(result).toEqual({
      status: "ok",
      response: {
        type: "order",
      },
    });

    expect(signer.signExchangeAction).toHaveBeenCalledWith(
      action,
      123456789,
    );

    expect(fetchMock).toHaveBeenCalledOnce();

    const requestBody = JSON.parse(
      String(fetchMock.mock.calls[0]?.[1]?.body),
    );

    expect(requestBody).toEqual({
      action,
      nonce: 123456789,
      signature: {
        r: "r",
        s: "s",
        v: 27,
      },
    });

    fetchMock.mockRestore();
  });

  it("rejects an invalid nonce before signing", async () => {
    const signer: ExchangeSigner = {
      signExchangeAction: vi.fn(),
    };

    const executor = new HyperliquidExchangeExecutor({
      signer,
    });

    await expect(
      executor.execute({ type: "order" }, 0),
    ).rejects.toThrow("Invalid exchange nonce");

    expect(signer.signExchangeAction).not.toHaveBeenCalled();
  });
});
