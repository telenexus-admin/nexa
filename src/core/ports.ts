import type {
  AuditRecord,
  Channel,
  ConversationMessage,
  Interaction,
  InteractionReference,
  NexaJob,
  SupportCase,
  SupportCaseReference,
  TenantConfig
} from "./contracts.js";
import type { EventHandler, NexaEvent } from "./events.js";

export interface EventBus {
  publish(event: NexaEvent): Promise<void>;
  subscribe(eventName: NexaEvent["name"], handler: EventHandler): void;
}

export interface AuditStore {
  append(record: AuditRecord): Promise<void>;
}

export interface IdempotencyStore {
  /**
   * Returns false when this key was already claimed.
   * Used to prevent duplicate webhook/payment/reconnection side effects.
   */
  claim(key: string, ttlSeconds: number): Promise<boolean>;
  release(key: string): Promise<void>;
}

export interface LockManager {
  withLock<T>(key: string, ttlSeconds: number, task: () => Promise<T>): Promise<T>;
}

export interface InteractionStore {
  create(interaction: Interaction): Promise<void>;
  update(interaction: Interaction): Promise<void>;
  get(interactionId: string): Promise<Interaction | null>;
  appendMessage(message: ConversationMessage): Promise<void>;
}

export interface SupportCaseStore {
  create(supportCase: SupportCase): Promise<void>;
  update(supportCase: SupportCase): Promise<void>;
  get(caseId: string): Promise<SupportCase | null>;
}

export interface JobStore {
  create(job: NexaJob): Promise<void>;
  update(job: NexaJob): Promise<void>;
  get(jobId: string): Promise<NexaJob | null>;
}

export interface TenantConfigStore {
  get(tenantId: string): Promise<TenantConfig | null>;
}

export interface OutboundCallRequest {
  tenantId: string;
  destination: string;
  purpose: "onboarding" | "support" | "approval" | "completion" | "incident" | "follow_up";
  context?: Record<string, unknown>;
}

export interface CallTransferRequest {
  interaction: InteractionReference;
  destination: string;
  reason: string;
  warmTransfer?: boolean;
  contextSummary?: string;
}

export interface TelephonyGateway {
  placeCall(request: OutboundCallRequest): Promise<{ providerCallId: string }>;
  transferCall(request: CallTransferRequest): Promise<{ providerCallId?: string; accepted: boolean }>;
}

export interface MessageRequest {
  tenantId: string;
  channel: Extract<Channel, "whatsapp" | "sms">;
  destination: string;
  text: string;
  context?: Record<string, unknown>;
}

export interface MessagingGateway {
  sendMessage(request: MessageRequest): Promise<{ providerMessageId: string }>;
}

export interface RecordingReference {
  interactionId: string;
  provider: string;
  providerRecordingId: string;
  sourceUrl?: string;
  durationSeconds?: number;
}

export interface RecordingArchive {
  register(recording: RecordingReference): Promise<{ recordingId: string }>;
}

export interface TranscriptReference {
  interactionId: string;
  provider?: string;
  providerTranscriptId?: string;
  text?: string;
  language?: string;
}

export interface TranscriptArchive {
  register(transcript: TranscriptReference): Promise<{ transcriptId: string }>;
}

export interface EscalationTarget {
  id: string;
  role: "admin" | "technician" | "billing" | "support" | "custom";
  displayName: string;
  phoneNumber?: string;
  whatsappNumber?: string;
  priority?: number;
  available?: boolean;
}

export interface EscalationDirectory {
  resolveTargets(tenantId: string, role: string): Promise<EscalationTarget[]>;
}

export interface DailyReportSink {
  deliver(input: {
    tenantId: string;
    reportDate: string;
    summary: string;
    recipients: string[];
    channel: "whatsapp" | "sms" | "email";
  }): Promise<void>;
}

export interface CallbackScheduler {
  schedule(input: {
    tenantId: string;
    jobId?: string;
    destination: string;
    reason: "completion" | "approval" | "failure" | "follow_up";
    notBefore?: string;
    context?: Record<string, unknown>;
  }): Promise<{ callbackId: string }>;
}

export interface SupportResolutionEngine {
  handle(input: {
    tenantId: string;
    interactionId: string;
    instruction: string;
    context?: Record<string, unknown>;
  }): Promise<{
    outcome: "resolved" | "escalate" | "needs_approval" | "pending";
    customerMessage?: string;
    supportCase?: SupportCaseReference;
    jobId?: string;
  }>;
}
