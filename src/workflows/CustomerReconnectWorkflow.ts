import crypto from "node:crypto";
import type {
  CustomerServiceSnapshot,
  ReconnectionResult
} from "../core/contracts.js";
import type { BillingGateway } from "../integrations/billing/BillingGateway.js";
import { BillingApiError } from "../integrations/billing/HmacBillingGateway.js";

export type ReconnectWorkflowStatus =
  | "resolved"
  | "needs_clarification"
  | "payment_required"
  | "pending"
  | "escalate";

export interface CustomerReconnectInput {
  tenantId: string;
  phoneNumber: string;
  customerId?: string;
  requestId?: string;
}

export interface CustomerReconnectOutcome {
  status: ReconnectWorkflowStatus;
  code: string;
  customerMessage: string;
  customer?: CustomerServiceSnapshot;
  candidates?: Array<{
    customerId: string;
    displayName?: string;
    accountNumber?: string;
    planName?: string | null;
  }>;
  reconnection?: ReconnectionResult;
}

export class CustomerReconnectWorkflow {
  constructor(private readonly billing: BillingGateway) {}

  async run(input: CustomerReconnectInput): Promise<CustomerReconnectOutcome> {
    const lookup = await this.billing.findCustomersByPhone(input.phoneNumber, input.tenantId);

    if (!lookup.matches.length) {
      return {
        status: "escalate",
        code: "CUSTOMER_NOT_FOUND",
        customerMessage:
          "I could not find an internet account linked to this phone number. I will need a customer reference or human support."
      };
    }

    let customer: CustomerServiceSnapshot | undefined;

    if (input.customerId) {
      customer = lookup.matches.find(
        (match) => String(match.customerId) === String(input.customerId)
      );
      if (!customer) {
        return {
          status: "needs_clarification",
          code: "CUSTOMER_ID_NOT_LINKED_TO_PHONE",
          customerMessage:
            "That account is not linked to the phone number being used. Please confirm the subscriber reference."
        };
      }
    } else if (lookup.matches.length === 1) {
      customer = lookup.matches[0];
    } else {
      return {
        status: "needs_clarification",
        code: "MULTIPLE_CUSTOMERS",
        customerMessage:
          "I found more than one internet account linked to this phone number. Please tell me the subscriber reference or package you want help with.",
        candidates: lookup.matches.map((match) => ({
          customerId: match.customerId,
          displayName: match.displayName,
          accountNumber: match.accountNumber,
          planName: match.plan?.name
        }))
      };
    }

    const live = await this.billing.getCustomerService(customer.customerId, input.tenantId);
    customer = live;

    if (customer.online) {
      return {
        status: "resolved",
        code: "ALREADY_ONLINE",
        customer,
        customerMessage:
          "Your account is active and I can already see an online internet session. If you still cannot browse, I can continue with connection troubleshooting."
      };
    }

    if (customer.serviceValid === false) {
      return {
        status: "payment_required",
        code: "SERVICE_EXPIRED",
        customer,
        customerMessage:
          "Your current subscription has expired, so I cannot reconnect it as an active package yet. I can help you with payment or renewal."
      };
    }

    if (
      customer.serviceStatus !== "active" &&
      customer.latestPaymentStatus !== "confirmed"
    ) {
      return {
        status: "escalate",
        code: "ACCOUNT_REVIEW_REQUIRED",
        customer,
        customerMessage:
          "Your account needs a billing review before I can safely reconnect it. I will escalate this without making an unsafe change."
      };
    }

    try {
      const reconnection = await this.billing.reconnectCustomer(
        customer.customerId,
        input.tenantId,
        input.requestId || crypto.randomUUID()
      );

      if (reconnection.verifiedOnline) {
        return {
          status: "resolved",
          code: "RECONNECTED",
          customer,
          reconnection,
          customerMessage:
            "I have restored your service and verified that your PPPoE session is online."
        };
      }

      if (reconnection.accepted) {
        return {
          status: "pending",
          code: "WAITING_FOR_SESSION",
          customer,
          reconnection,
          customerMessage:
            "Your RADIUS access has been restored, but I cannot see the router online yet. Please restart your router or CPE once; I can check the session again after it reconnects."
        };
      }

      return {
        status: "escalate",
        code: "RECONNECT_REJECTED",
        customer,
        reconnection,
        customerMessage:
          "I could not safely complete the reconnection automatically. I will escalate the issue with the checks I have already performed."
      };
    } catch (error) {
      if (error instanceof BillingApiError) {
        if (error.code === "SERVICE_EXPIRED") {
          return {
            status: "payment_required",
            code: error.code,
            customer,
            customerMessage:
              "Your subscription is expired. I can help you renew it before reconnecting."
          };
        }
        if (["STATE_REQUIRES_REVIEW", "PLAN_INACTIVE"].includes(error.code || "")) {
          return {
            status: "escalate",
            code: error.code || "REVIEW_REQUIRED",
            customer,
            customerMessage:
              "The account needs a billing or administrator review before it can be safely reconnected."
          };
        }
      }

      return {
        status: "escalate",
        code: "RECONNECT_ERROR",
        customer,
        customerMessage:
          "I could not complete the reconnection automatically. I will escalate it together with the diagnostics already collected."
      };
    }
  }
}
