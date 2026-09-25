import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  BuilderFeeService,
  InMemoryBuilderApprovalStore,
} from "../client/builder-fee-service.js";

describe(
  "BuilderFeeService",
  () => {
    const user =
      "0x1111111111111111111111111111111111111111";

    const builder =
      "0x2222222222222222222222222222222222222222";

    function createService(
      maxFeeRate = 100,
    ) {
      const info = {
        maxBuilderFee:
          vi.fn().mockResolvedValue({
            maxFeeRate,
          }),

        createBuilderFeeApprovalAction:
          vi.fn().mockReturnValue({
            type: "approveBuilderFee",
            builder,
            maxFeeRate: 10,
          }),
      };

      const exchange = {
        execute:
          vi.fn().mockResolvedValue({
            status: "ok",
          }),
      };

      const store =
        new InMemoryBuilderApprovalStore();

      const service =
        new BuilderFeeService({
          info,
          exchange,
          store,
        });

      return {
        service,
        info,
        exchange,
        store,
      };
    }

    it(
      "reads and validates the remote maximum builder fee",
      async () => {
        const {
          service,
          info,
        } = createService(100);

        await expect(
          service.getMaxBuilderFee(
            user,
            builder,
          ),
        ).resolves.toBe(100);

        expect(
          info.maxBuilderFee,
        ).toHaveBeenCalledWith(
          user,
          builder,
        );
      },
    );

    it(
      "rejects an invalid remote maximum",
      async () => {
        const { service } =
          createService(0);

        await expect(
          service.getMaxBuilderFee(
            user,
            builder,
          ),
        ).rejects.toThrow(
          "Hyperliquid returned an invalid max builder fee rate",
        );
      },
    );

    it(
      "executes approval and records approval state",
      async () => {
        const {
          service,
          exchange,
          store,
        } = createService(100);

        const result =
          await service.approveBuilderFee(
            user,
            builder,
            10,
            123,
          );

        expect(
          exchange.execute,
        ).toHaveBeenCalledWith(
          {
            type:
              "approveBuilderFee",
            builder,
            maxFeeRate: 10,
          },
          123,
        );

        expect(result).toMatchObject({
          user,
          builder,
          maxFeeRate: 10,
        });

        expect(
          store.get(
            user,
            builder,
          ),
        ).toEqual(result);
      },
    );

    it(
      "does not approve a fee above Hyperliquid maximum",
      async () => {
        const {
          service,
          exchange,
        } = createService(10);

        await expect(
          service.approveBuilderFee(
            user,
            builder,
            11,
            123,
          ),
        ).rejects.toThrow(
          "Builder fee rate 11 exceeds Hyperliquid maximum 10",
        );

        expect(
          exchange.execute,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "requires approval before execution",
      () => {
        const { service } =
          createService(100);

        expect(() =>
          service.assertApproved(
            user,
            builder,
            10,
          ),
        ).toThrow(
          "Builder fee is not approved for this account",
        );
      },
    );

    it(
      "rejects execution above approved maximum",
      async () => {
        const { service } =
          createService(100);

        await service.approveBuilderFee(
          user,
          builder,
          10,
          123,
        );

        expect(() =>
          service.assertApproved(
            user,
            builder,
            11,
          ),
        ).toThrow(
          "Builder fee rate 11 exceeds approved maximum 10",
        );
      },
    );

    it(
      "accepts execution at or below approved maximum",
      async () => {
        const { service } =
          createService(100);

        await service.approveBuilderFee(
          user,
          builder,
          10,
          123,
        );

        expect(
          service.assertApproved(
            user,
            builder,
            10,
          ).maxFeeRate,
        ).toBe(10);

        expect(
          service.assertApproved(
            user,
            builder,
            1,
          ).maxFeeRate,
        ).toBe(10);
      },
    );
  },
);
