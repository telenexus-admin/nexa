import type {
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
  findCustomerByPhone(phoneNumber: string): Promise<CustomerServiceSnapshot | null>;
  getCustomerService(customerId: string, tenantId: string): Promise<CustomerServiceSnapshot>;
  reconnectCustomer(customerId: string, tenantId: string): Promise<ReconnectionResult>;
}
