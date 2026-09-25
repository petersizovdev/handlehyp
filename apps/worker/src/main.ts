import { HyperliquidWebSocketClient } from "./ws/hyperliquid-ws-client.js";
import { MarketStateTracker } from "./services/market-state.js";
import { RedisEventBus } from "./services/event-bus.js";
import { StrategyEngine } from "@handlehyp/strategies";
import { InMemorySignalStore } from "./signal-store.js";
import {
  OIAnomalyStrategy,
  VolumeSpikeStrategy,
  FundingExtremeStrategy,
  WhaleAccumulationStrategy,
  LiquidationCascadeStrategy,
} from "@handlehyp/strategies";

export interface WorkerConfig {
  redisUrl?: string;
  hyperliquidWsUrl?: string;
}

const STRATEGIES = [
  new OIAnomalyStrategy(),
  new VolumeSpikeStrategy(),
  new FundingExtremeStrategy(),
  new WhaleAccumulationStrategy(),
  new LiquidationCascadeStrategy(),
];

export async function startWorker(
  config: WorkerConfig = {},
): Promise<{
  wsClient: HyperliquidWebSocketClient;
  marketState: MarketStateTracker;
  eventBus: RedisEventBus;
  engine: StrategyEngine;
}> {
  console.log(
    "HandleHYP worker starting...",
  );

  const eventBus = new RedisEventBus({
    host: config.redisUrl?.split(":")[0] ??
      "127.0.0.1",
  });

  await eventBus.connect();

  const marketState =
    new MarketStateTracker();

  const signalStore = new InMemorySignalStore();

  const engine = new StrategyEngine({
    strategies: STRATEGIES,
    signalStore,
  });

  const wsClient =
    new HyperliquidWebSocketClient(
      config.hyperliquidWsUrl !== undefined
        ? { url: config.hyperliquidWsUrl }
        : {},
    );

  wsClient.onMessage(
    async (message) => {
      marketState.update(message);

      if (
        message.channel === "allMids" ||
        message.channel === "l2Book"
      ) {
        void eventBus.publish(
          "market:update",
          {
            channel: message.channel,
            data: message.data,
          },
        );
      }

      if (message.channel === "allMids") {
        const data = message.data.mid;

        const allMidsData = {
          coin: "BTC",
          price: data.BTC ?? "0",
          previousPrice: "0",
          volume: "0",
          previousVolume: "0",
          openInterest: "0",
          previousOpenInterest: "0",
          fundingRate: "0",
          previousFundingRate: "0",
          timestamp: Date.now(),
        };

        const signals = await engine.evaluate(
          allMidsData,
        );

        if (signals.length > 0) {
          void eventBus.publish(
            "signal:new",
            { signals },
          );
        }
      }
    },
  );

  wsClient.connect();

  wsClient.subscribe("allMids");

  console.log(
    "HandleHYP worker started: subscribed to market data",
  );

  return {
    wsClient,
    marketState,
    eventBus,
    engine,
  };
}

export {
  HyperliquidWebSocketClient,
  MarketStateTracker,
  RedisEventBus,
};
