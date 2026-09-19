import crypto from "node:crypto";
import type {
  CustomerLookupResult,
  CustomerServiceSnapshot,
  ReconnectionResult
} from "../../core/contracts.js";
import type { BillingGateway } from "./BillingGateway.js";

export interface HmacBillingGatewayOptions {
  baseUrl: string;
  secret: string;
  timeoutMs?: number;
}

export class BillingApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly payload?: unknown
  ) {
    super(message);
    this.name = "BillingApiError";
  }
}

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, "");
}

export class HmacBillingGateway implements BillingGateway {
  private readonly baseUrl: string;
  private readonly secret: string;
  private readonly timeoutMs: number;

  constructor(options: HmacBillingGatewayOptions) {
    this.baseUrl = normalizeBaseUrl(options.baseUrl);
    this.secret = options.secret;
    this.timeoutMs = options.timeoutMs ?? 12_000;
  }

  private async request<T>(
    method: "GET" | "POST",
    path: string,
    tenantId: string,
    body?: Record<string, unknown>
  ): Promise<T> {
    const timestamp = Math.floor(Date.now() / 1000);
    const bodyObject = body ?? {};
    const bodyText = JSON.stringify(bodyObject);
    const canonical = [
      String(timestamp),
      method,
      path,
      String(tenantId),
      sha256(bodyText)
    ].join("\n");

    const signature = crypto
      .createHmac("sha256", this.secret)
      .update(canonical)
      .digest("hex");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        signal: controller.signal,
        headers: {
          "accept": "application/json",
          "content-type": "application/json",
          "x-nexa-timestamp": String(timestamp),
          "x-nexa-tenant-id": String(tenantId),
          "x-nexa-signature": signature,
          "x-request-id": crypto.randomUUID()
        },
        ...(method === "POST" ? { body: bodyText } : {})
      });

      const raw = await response.text();
      let payload: any = null;
      try {
        payload = raw ? JSON.parse(raw) : null;
      } catch {
        payload = { error: raw || "Billing API returned an invalid response" };
      }

      if (!response.ok) {
        throw new BillingApiError(
          payload?.message || payload?.error || `Billing API returned HTTP ${response.status}`,
          response.status,
          payload?.code,
          payload
        );
      }

      return payload as T;
    } catch (error) {
      if (error instanceof BillingApiError) throw error;
      if (error instanceof Error && error.name === "AbortError") {
        throw new BillingApiError("Billing API request timed out", 504, "BILLING_TIMEOUT");
      }
      throw new BillingApiError(
        error instanceof Error ? error.message : "Billing API request failed",
        502,
        "BILLING_UNAVAILABLE"
      );
    } finally {
      clearTimeout(timer);
    }
  }

  async findCustomersByPhone(phoneNumber: string, tenantId: string): Promise<CustomerLookupResult> {
    const encoded = encodeURIComponent(phoneNumber);
    const result = await this.request<{ phone: string; matches: CustomerServiceSnapshot[] }>(
      "GET",
      `/api/internal/nexa/customer/by-phone/${encoded}`,
      tenantId
    );
    return {
      phoneNumber: result.phone,
      matches: Array.isArray(result.matches) ? result.matches : []
    };
  }

  async getCustomerService(customerId: string, tenantId: string): Promise<CustomerServiceSnapshot> {
    return this.request<CustomerServiceSnapshot>(
      "GET",
      `/api/internal/nexa/customer/${encodeURIComponent(customerId)}/status`,
      tenantId
    );
  }

  async reconnectCustomer(
    customerId: string,
    tenantId: string,
    requestId = crypto.randomUUID()
  ): Promise<ReconnectionResult> {
    return this.request<ReconnectionResult>(
      "POST",
      `/api/internal/nexa/customer/${encodeURIComponent(customerId)}/reconnect`,
      tenantId,
      { requestId }
    );
  }
}
