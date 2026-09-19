import { z } from "zod";

const optionalUrl = z.string().url().optional().or(z.literal(""));

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(8080),
  HOST: z.string().default("0.0.0.0"),

  BILLING_API_BASE_URL: optionalUrl,
  BILLING_API_TOKEN: z.string().optional(),

  VAPI_WEBHOOK_SECRET: z.string().optional(),
  WHATSAPP_VERIFY_TOKEN: z.string().optional(),
  WHATSAPP_ACCESS_TOKEN: z.string().optional(),

  NEXA_NETWORK_API_BASE_URL: optionalUrl,
  NEXA_NETWORK_API_TOKEN: z.string().optional(),

  OPENAI_API_KEY: z.string().optional()
});

export const config = schema.parse(process.env);
