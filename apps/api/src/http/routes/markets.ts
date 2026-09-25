import type { FastifyInstance } from "fastify";

import { MarketService } from "@handlehyp/hyperliquid";

import { perpetualMarketsSchema } from "../schemas/markets.js";

export async function marketsRoutes(app: FastifyInstance): Promise<void> {
  const marketService = new MarketService();

  app.get("/markets", async (_request, reply) => {
    try {
      const markets = await marketService.getPerpetualMarkets();

      const validatedMarkets = perpetualMarketsSchema.parse(markets);

      return reply.status(200).send(validatedMarkets);
    } catch (error) {
      app.log.error(error, "Failed to load perpetual markets");

      return reply.status(502).send({
        error: "MARKET_DATA_UNAVAILABLE",
        message: "Failed to load market data",
      });
    }
  });
}
