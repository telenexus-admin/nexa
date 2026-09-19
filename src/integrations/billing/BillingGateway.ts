import type {
  CustomerLookupResult,
  CustomerServiceSnapshot,
  ReconnectionResult
} from "../../core/contracts.js";

/**
 * Boundary between Nexa and the billing/RADIUS core.
 *
 * Keep implementation behind a restricted internal billing API.
 * Do not give Nexa direct production database access.
 */
export interface BillingGateway {
  findCustomersByPhone(phoneNumber: string, tenantId: string): Promise<CustomerLookupResult>;
  getCustomerService(customerId: string, tenantId: string): Promise<CustomerServiceSnapshot>;
  reconnectCustomer(
    customerId: string,
    tenantId: string,
    requestId?: string
  ): Promise<ReconnectionResult>;
}
