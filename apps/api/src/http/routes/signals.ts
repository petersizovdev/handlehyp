import type { FastifyInstance } from "fastify";

import { StrategyEngine } from "@handlehyp/strategies";
import { InMemorySignalStore } from "../../signal-store.js";
import {
  OIAnomalyStrategy,
  VolumeSpikeStrategy,
  FundingExtremeStrategy,
  WhaleAccumulationStrategy,
  LiquidationCascadeStrategy,
} from "@handlehyp/strategies";

const strategies = [
  new OIAnomalyStrategy(),
  new VolumeSpikeStrategy(),
  new FundingExtremeStrategy(),
  new WhaleAccumulationStrategy(),
  new LiquidationCascadeStrategy(),
];

export async function signalsRoutes(app: FastifyInstance): Promise<void> {
  const signalStore = new InMemorySignalStore();
  const engine = new StrategyEngine({
    strategies,
    signalStore,
  });

  app.get("/signals", async (_request, reply) => {
    const signals = await signalStore.getByCoin("BTC");

    return reply.status(200).send(signals);
  });

  app.post("/signals/evaluate", async (request, reply) => {
    const body = request.body as {
      coin: string;
      price: string;
      previousPrice: string;
      volume: string;
      previousVolume: string;
      openInterest: string;
      previousOpenInterest: string;
      fundingRate: string;
      previousFundingRate: string;
      timestamp: number;
    };

    try {
      const signals = await engine.evaluate(body);

      return reply.status(200).send(signals);
    } catch (error) {
      app.log.error(error, "Signal evaluation failed");

      return reply.status(500).send({
        error: "SIGNAL_EVALUATION_FAILED",
        message: "Failed to evaluate signals",
      });
    }
  });
}
