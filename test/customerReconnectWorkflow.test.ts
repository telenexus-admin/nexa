import assert from "node:assert/strict";
import test from "node:test";
import type {
  CustomerLookupResult,
  CustomerServiceSnapshot,
  ReconnectionResult
} from "../src/core/contracts.js";
import type { BillingGateway } from "../src/integrations/billing/BillingGateway.js";
import { CustomerReconnectWorkflow } from "../src/workflows/CustomerReconnectWorkflow.js";

class FakeBilling implements BillingGateway {
  constructor(
    private lookup: CustomerLookupResult,
    private status: CustomerServiceSnapshot,
    private reconnect: ReconnectionResult
  ) {}

  async findCustomersByPhone(): Promise<CustomerLookupResult> {
    return this.lookup;
  }

  async getCustomerService(): Promise<CustomerServiceSnapshot> {
    return this.status;
  }

  async reconnectCustomer(): Promise<ReconnectionResult> {
    return this.reconnect;
  }
}

function customer(overrides: Partial<CustomerServiceSnapshot> = {}): CustomerServiceSnapshot {
  return {
    customerId: "42",
    tenantId: "7",
    displayName: "Test Customer",
    phoneNumber: "254700000000",
    accountNumber: "PX-42",
    serviceStatus: "active",
    radiusStatus: "active",
    radiusSyncStatus: "synced",
    serviceValid: true,
    online: false,
    latestPaymentStatus: "confirmed",
    plan: { id: "3", name: "20 Mbps", active: true, price: 2000 },
    ...overrides
  };
}

test("returns resolved when the subscriber is already online", async () => {
  const c = customer({ online: true });
  const flow = new CustomerReconnectWorkflow(
    new FakeBilling({ phoneNumber: c.phoneNumber!, matches: [c] }, c, {
      accepted: true,
      verifiedOnline: true,
      message: "unused"
    })
  );

  const result = await flow.run({ tenantId: "7", phoneNumber: c.phoneNumber! });
  assert.equal(result.status, "resolved");
  assert.equal(result.code, "ALREADY_ONLINE");
});

test("does not reconnect an expired subscriber", async () => {
  const c = customer({ serviceValid: false, latestPaymentStatus: "missing" });
  const flow = new CustomerReconnectWorkflow(
    new FakeBilling({ phoneNumber: c.phoneNumber!, matches: [c] }, c, {
      accepted: false,
      verifiedOnline: false,
      message: "unused"
    })
  );

  const result = await flow.run({ tenantId: "7", phoneNumber: c.phoneNumber! });
  assert.equal(result.status, "payment_required");
  assert.equal(result.code, "SERVICE_EXPIRED");
});

test("reports success only when billing verifies an online session", async () => {
  const c = customer();
  const flow = new CustomerReconnectWorkflow(
    new FakeBilling({ phoneNumber: c.phoneNumber!, matches: [c] }, c, {
      accepted: true,
      verifiedOnline: true,
      message: "online"
    })
  );

  const result = await flow.run({ tenantId: "7", phoneNumber: c.phoneNumber! });
  assert.equal(result.status, "resolved");
  assert.equal(result.code, "RECONNECTED");
});

test("asks for clarification when a phone has multiple subscribers", async () => {
  const a = customer({ customerId: "42", accountNumber: "PX-42" });
  const b = customer({ customerId: "43", accountNumber: "PX-43" });
  const flow = new CustomerReconnectWorkflow(
    new FakeBilling({ phoneNumber: a.phoneNumber!, matches: [a, b] }, a, {
      accepted: true,
      verifiedOnline: true,
      message: "unused"
    })
  );

  const result = await flow.run({ tenantId: "7", phoneNumber: a.phoneNumber! });
  assert.equal(result.status, "needs_clarification");
  assert.equal(result.code, "MULTIPLE_CUSTOMERS");
  assert.equal(result.candidates?.length, 2);
});
