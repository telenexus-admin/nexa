import type { FastifyInstance } from "fastify";

/**
 * These endpoints intentionally begin as safe ingress stubs.
 * We will attach signature verification and real Vapi/WhatsApp payload
 * contracts before enabling production actions.
 */
export async function registerChannelRoutes(app: FastifyInstance) {
  app.post("/webhooks/vapi", async (_request, reply) => {
    return reply.code(202).send({
      accepted: true,
      integration: "vapi",
      mode: "scaffold"
    });
  });

  app.post("/webhooks/whatsapp", async (_request, reply) => {
    return reply.code(202).send({
      accepted: true,
      integration: "whatsapp",
      mode: "scaffold"
    });
  });
}
