import type {
  Channel,
  CustomerReference,
  InteractionReference,
  NexaJob,
  SupportCaseReference,
  TenantReference
} from "./contracts.js";

export interface EventEnvelope<TName extends string, TPayload> {
  id: string;
  name: TName;
  occurredAt: string;
  tenant?: TenantReference;
  correlationId?: string;
  causationId?: string;
  payload: TPayload;
}

export type NexaEvent =
  | EventEnvelope<"customer.first_purchase.detected", {
      customer: CustomerReference;
      phoneNumber?: string;
      preferredChannel?: Channel;
    }>
  | EventEnvelope<"interaction.started", {
      interaction: InteractionReference;
      customer?: CustomerReference;
    }>
  | EventEnvelope<"interaction.completed", {
      interaction: InteractionReference;
      customer?: CustomerReference;
      resolution?: string;
    }>
  | EventEnvelope<"support.case.opened", {
      supportCase: SupportCaseReference;
      customer?: CustomerReference;
      summary: string;
    }>
  | EventEnvelope<"support.case.resolved", {
      supportCase: SupportCaseReference;
      resolution: string;
    }>
  | EventEnvelope<"support.escalation.requested", {
      supportCase: SupportCaseReference;
      reason: string;
      requestedRole?: string;
    }>
  | EventEnvelope<"support.escalation.completed", {
      supportCase: SupportCaseReference;
      destination: string;
      outcome: string;
    }>
  | EventEnvelope<"call.recording.available", {
      interaction: InteractionReference;
      recordingId: string;
      provider: string;
    }>
  | EventEnvelope<"automation.job.created", {
      job: NexaJob;
    }>
  | EventEnvelope<"automation.job.needs_approval", {
      jobId: string;
      approvalId: string;
      reason: string;
    }>
  | EventEnvelope<"automation.job.completed", {
      jobId: string;
      result: string;
    }>
  | EventEnvelope<"daily.report.requested", {
      reportDate: string;
    }>;

export type EventHandler<TEvent extends NexaEvent = NexaEvent> =
  (event: TEvent) => Promise<void>;
