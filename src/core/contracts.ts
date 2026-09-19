export type Channel = "vapi" | "whatsapp" | "sms" | "system";

export type JobStatus =
  | "queued"
  | "investigating"
  | "working"
  | "needs_approval"
  | "completed"
  | "failed"
  | "cancelled";

export interface TenantReference {
  tenantId: string;
}

export interface CustomerReference {
  customerId: string;
  tenantId: string;
}

export interface InteractionReference {
  interactionId: string;
  tenantId: string;
}

export interface SupportCaseReference {
  caseId: string;
  tenantId: string;
}

export interface Interaction {
  id: string;
  tenantId: string;
  channel: Channel;
  direction: "inbound" | "outbound";
  status: "active" | "completed" | "transferred" | "failed";
  externalId?: string;
  customerId?: string;
  startedAt: string;
  endedAt?: string;
  recordingId?: string;
  transcriptId?: string;
}

export interface ConversationMessage {
  id: string;
  tenantId: string;
  interactionId: string;
  actor: "customer" | "nexa" | "human_agent" | "system";
  text: string;
  occurredAt: string;
  externalId?: string;
  metadata?: Record<string, unknown>;
}

export interface SupportCase {
  id: string;
  tenantId: string;
  interactionId?: string;
  customerId?: string;
  title: string;
  summary: string;
  category?: string;
  severity?: "low" | "medium" | "high" | "critical";
  status: "open" | "investigating" | "waiting_customer" | "escalated" | "resolved" | "closed";
  resolution?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NexaJob {
  id: string;
  tenantId: string;
  channel: Channel;
  instruction: string;
  status: JobStatus;
  customer?: CustomerReference;
  interactionId?: string;
  supportCaseId?: string;
  callbackPolicy?: {
    onCompletion?: boolean;
    onApproval?: boolean;
    onFailure?: boolean;
    destination?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Approval {
  id: string;
  tenantId: string;
  jobId: string;
  action: string;
  status: "pending" | "approved" | "rejected" | "expired";
  requestedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  reason?: string;
}

export interface AuditRecord {
  id: string;
  tenantId: string;
  occurredAt: string;
  actorType: "customer" | "nexa" | "human" | "system" | "codex";
  actorId?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  interactionId?: string;
  supportCaseId?: string;
  jobId?: string;
  outcome: "success" | "failure" | "denied" | "pending";
  metadata?: Record<string, unknown>;
}

export interface TenantConfig {
  tenantId: string;
  displayName: string;
  timezone: string;
  support: {
    defaultLanguage?: string;
    onboardingEnabled: boolean;
    onboardingChannels: Array<Extract<Channel, "vapi" | "whatsapp" | "sms">>;
    dailyReportEnabled: boolean;
    recordingEnabled: boolean;
    transcriptEnabled?: boolean;
  };
  escalation: {
    defaultRole?: string;
    allowCallTransfer: boolean;
    warmTransferByDefault?: boolean;
  };
  autonomy: {
    targetRoutineResolutionPercent?: number;
    requireCustomerVerificationForSensitiveActions: boolean;
  };
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
