import { randomUUID } from "node:crypto";
import type {
  AuditStore,
  CallbackScheduler,
  EscalationDirectory,
  EventBus,
  InteractionStore,
  MessagingGateway,
  SupportCaseStore,
  SupportResolutionEngine,
  TelephonyGateway,
  TenantConfigStore
} from "../core/ports.js";
import type {
  Channel,
  Interaction,
  SupportCase
} from "../core/contracts.js";

export interface NexaOrchestratorDependencies {
  eventBus: EventBus;
  audit: AuditStore;
  interactions: InteractionStore;
  cases: SupportCaseStore;
  tenants: TenantConfigStore;
  telephony: TelephonyGateway;
  messaging: MessagingGateway;
  escalationDirectory: EscalationDirectory;
  callbacks: CallbackScheduler;
  resolutionEngine: SupportResolutionEngine;
}

/**
 * Central application orchestrator.
 *
 * Channel adapters (Vapi, WhatsApp, SMS) should translate provider payloads
 * into this application layer. Billing, RADIUS, MikroTik and Codex remain
 * behind gateways used by the resolution engine.
 */
export class NexaOrchestrator {
  constructor(private readonly deps: NexaOrchestratorDependencies) {}

  async startInteraction(input: {
    tenantId: string;
    channel: Channel;
    direction: "inbound" | "outbound";
    externalId?: string;
    customerId?: string;
  }): Promise<Interaction> {
    const now = new Date().toISOString();
    const interaction: Interaction = {
      id: randomUUID(),
      tenantId: input.tenantId,
      channel: input.channel,
      direction: input.direction,
      status: "active",
      externalId: input.externalId,
      customerId: input.customerId,
      startedAt: now
    };

    await this.deps.interactions.create(interaction);
    await this.deps.eventBus.publish({
      id: randomUUID(),
      name: "interaction.started",
      occurredAt: now,
      tenant: { tenantId: input.tenantId },
      correlationId: interaction.id,
      payload: {
        interaction: { interactionId: interaction.id, tenantId: input.tenantId },
        customer: input.customerId
          ? { customerId: input.customerId, tenantId: input.tenantId }
          : undefined
      }
    });

    return interaction;
  }

  async openSupportCase(input: {
    tenantId: string;
    interactionId?: string;
    customerId?: string;
    title: string;
    summary: string;
    category?: string;
  }): Promise<SupportCase> {
    const now = new Date().toISOString();
    const supportCase: SupportCase = {
      id: randomUUID(),
      tenantId: input.tenantId,
      interactionId: input.interactionId,
      customerId: input.customerId,
      title: input.title,
      summary: input.summary,
      category: input.category,
      status: "open",
      createdAt: now,
      updatedAt: now
    };

    await this.deps.cases.create(supportCase);
    await this.deps.eventBus.publish({
      id: randomUUID(),
      name: "support.case.opened",
      occurredAt: now,
      tenant: { tenantId: input.tenantId },
      correlationId: supportCase.id,
      payload: {
        supportCase: { caseId: supportCase.id, tenantId: input.tenantId },
        customer: input.customerId
          ? { customerId: input.customerId, tenantId: input.tenantId }
          : undefined,
        summary: input.summary
      }
    });

    return supportCase;
  }
}
