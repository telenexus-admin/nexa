export type Channel = "vapi" | "whatsapp" | "system";

export type JobStatus =
  | "queued"
  | "investigating"
  | "working"
  | "needs_approval"
  | "completed"
  | "failed";

export interface CustomerReference {
  customerId: string;
  tenantId: string;
}

export interface NexaJob {
  id: string;
  channel: Channel;
  instruction: string;
  status: JobStatus;
  customer?: CustomerReference;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerServiceSnapshot {
  customerId: string;
  tenantId: string;
  displayName?: string;
  serviceStatus: "active" | "suspended" | "unknown";
  outstandingBalance?: number;
  currency?: string;
  latestPaymentStatus?: "confirmed" | "pending" | "missing" | "unknown";
}

export interface ReconnectionResult {
  accepted: boolean;
  verifiedOnline: boolean;
  message: string;
  evidence?: Record<string, unknown>;
}
