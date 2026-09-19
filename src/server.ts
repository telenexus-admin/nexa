import Fastify from "fastify";
import { config } from "./config.js";
import { registerHealthRoutes } from "./routes/health.js";
import { registerChannelRoutes } from "./routes/channels.js";

const app = Fastify({
  logger: {
    level: config.NODE_ENV === "production" ? "info" : "debug"
  }
});

await registerHealthRoutes(app);
await registerChannelRoutes(app);

async function shutdown(signal: string) {
  app.log.info({ signal }, "shutting down");
  await app.close();
  process.exit(0);
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

try {
  await app.listen({ host: config.HOST, port: config.PORT });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
