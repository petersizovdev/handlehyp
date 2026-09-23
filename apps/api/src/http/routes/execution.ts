import type { FastifyInstance } from "fastify";

import type {
  ExecutionIntent,
} from "@handlehyp/execution";
import { createExecutionIntent } from "@handlehyp/execution";
import { normalizeOrderIntent } from "@handlehyp/trading";
import { createBuilderCodeConfig } from "@handlehyp/trading";

export interface ExecutionRequest {
  coin: string;
  side: "buy" | "sell";
  size: string;
  type: "market" | "limit";
  limitPrice?: string;
  builderAddress: string;
  maxFeeRate: number;
}

export async function executionRoutes(app: FastifyInstance): Promise<void> {
  app.post("/execution", async (request, reply) => {
    const body = request.body as ExecutionRequest;

    try {
      const normalized = normalizeOrderIntent({
        account: {
          telegramUserId: 0,
          walletAddress: "0x000000000000000000000000000000000000000",
        },
        coin: body.coin,
        side: body.side,
        type: body.type,
        size: body.size,
        ...(body.limitPrice !== undefined && {
          limitPrice: body.limitPrice,
        }),
      });

      const builder = createBuilderCodeConfig(
        body.builderAddress,
        body.maxFeeRate,
      );

      const intent: ExecutionIntent = createExecutionIntent({
        order: normalized,
        builder,
      });

      return reply.status(200).send({
        order: intent.order,
        builder: intent.builder,
        makerPolicy: intent.makerPolicy,
        fallbackPolicy: intent.fallbackPolicy,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error";

      return reply.status(400).send({
        error: "EXECUTION_ERROR",
        message,
      });
    }
  });
}
