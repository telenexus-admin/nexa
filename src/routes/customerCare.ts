import crypto from "node:crypto";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { config } from "../config.js";
import { HmacBillingGateway } from "../integrations/billing/HmacBillingGateway.js";
import { CustomerReconnectWorkflow } from "../workflows/CustomerReconnectWorkflow.js";

const reconnectSchema = z.object({
  tenantId: z.union([z.string(), z.number()]).transform(String),
  phoneNumber: z.string().min(7).max(40),
  customerId: z.union([z.string(), z.number()]).transform(String).optional(),
  requestId: z.string().max(128).optional()
});

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length > 0 && a.length === b.length && crypto.timingSafeEqual(a, b);
}

function authorizeOperator(request: FastifyRequest): boolean {
  const expected = String(config.NEXA_OPERATOR_API_TOKEN || "").trim();
  if (!expected) return false;
  const header = String(request.headers.authorization || "").trim();
  const received = header.toLowerCase().startsWith("bearer ")
    ? header.slice(7).trim()
    : "";
  return safeEqual(received, expected);
}

export async function registerCustomerCareRoutes(app: FastifyInstance) {
  app.post("/api/customer-care/reconnect", async (request, reply) => {
    if (!authorizeOperator(request)) {
      return reply.code(config.NEXA_OPERATOR_API_TOKEN ? 401 : 503).send({
        error: config.NEXA_OPERATOR_API_TOKEN
          ? "Unauthorized"
          : "Nexa operator API is not configured"
      });
    }

    if (!config.BILLING_API_BASE_URL || !config.BILLING_API_SECRET) {
      return reply.code(503).send({
        error: "Billing integration is not configured"
      });
    }

    const parsed = reconnectSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: "Invalid reconnect request",
        details: parsed.error.flatten()
      });
    }

    const billing = new HmacBillingGateway({
      baseUrl: config.BILLING_API_BASE_URL,
      secret: config.BILLING_API_SECRET
    });
    const workflow = new CustomerReconnectWorkflow(billing);
    const outcome = await workflow.run(parsed.data);

    const code =
      outcome.status === "resolved" ? 200 :
      outcome.status === "pending" ? 202 :
      outcome.status === "needs_clarification" ? 409 :
      outcome.status === "payment_required" ? 402 :
      424;

    return reply.code(code).send(outcome);
  });
}
