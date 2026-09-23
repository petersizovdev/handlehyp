import Fastify from "fastify";

import { authRoutes } from "./http/routes/auth.js";
import { authMeRoutes } from "./http/routes/auth-me.js";
import { marketsRoutes } from "./http/routes/markets.js";
import { signalsRoutes } from "./http/routes/signals.js";
import { executionRoutes } from "./http/routes/execution.js";

const app = Fastify({
  logger: true,
});

app.get("/health", async () => ({
  status: "ok",
  service: "api",
}));

await app.register(authRoutes);
await app.register(authMeRoutes);
await app.register(marketsRoutes);
await app.register(signalsRoutes);
await app.register(executionRoutes);

const port = Number(process.env.PORT ?? 3000);

await app.listen({
  host: "0.0.0.0",
  port,
});
