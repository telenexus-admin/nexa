import type { FastifyInstance } from "fastify";

export async function registerHealthRoutes(app: FastifyInstance) {
  app.get("/health", async () => ({
    ok: true,
    service: "nexa",
    timestamp: new Date().toISOString()
  }));

  app.get("/ready", async () => ({
    ready: true,
    service: "nexa"
  }));
}
