# Nexa Customer Care Ecosystem

## North star

Nexa is not a chatbot and not a single Vapi webhook.

Nexa is a multi-tenant autonomous customer-care and operations platform for ISPs. Voice, WhatsApp, SMS and future channels are adapters around one shared support brain, workflow engine, policy layer, audit trail and customer history.

## Capabilities the foundation must support

### Customer lifecycle automation
- first-purchase onboarding call and/or WhatsApp message;
- explain the official support number/channel;
- proactive follow-up and service notifications;
- customer-aware conversations using billing context.

### High-autonomy customer care
Nexa should aim to resolve the majority of routine support without a human:
- payment/account questions;
- reconnection;
- suspension and expiry questions;
- RADIUS/PPPoE/Hotspot diagnostics;
- safe session recovery;
- basic MikroTik/service-health checks;
- package/invoice information;
- ticket creation and follow-up.

The target of resolving approximately 90% of routine issues is a product goal, not a permission to bypass safety or authorization controls.

### Human escalation
When Nexa cannot safely resolve an issue:
- choose the appropriate escalation role;
- call or transfer to an administrator, technician, billing officer or support agent;
- support warm transfer with a context summary;
- preserve the original support case;
- continue follow-up after the human handoff.

### Records and reporting
Every interaction should be capable of producing:
- provider call/message identifiers;
- recording reference for voice calls when enabled and lawfully disclosed;
- transcript reference when enabled;
- tool/action audit trail;
- support-case timeline;
- compact customer-facing resolution summary;
- daily tenant/admin support report.

### Operations and engineering
The same platform may later support:
- Codex tasks;
- callbacks on completion or approval;
- automated monitoring;
- RADIUS/WireGuard/MikroTik incidents;
- approval policies for sensitive actions.

## Architectural shape

```text
                            CUSTOMER / ADMIN
                      /          |          \
                   Vapi      WhatsApp       SMS
                    |            |           |
                    +------------+-----------+
                                 |
                       CHANNEL ADAPTER LAYER
                                 |
                         NEXA ORCHESTRATOR
                                 |
             +-------------------+-------------------+
             |                   |                   |
      CONVERSATION          WORKFLOW / JOB      POLICY ENGINE
        CONTEXT                ENGINE             (deterministic)
             |                   |                   |
             +-------------------+-------------------+
                                 |
       +-------------------------+--------------------------+
       |                         |                          |
 BILLING GATEWAY           NETWORK GATEWAY            CODEX GATEWAY
       |                         |                          |
 Billing / Payments      RADIUS / WireGuard          Engineering /
 Customer / Invoice       MikroTik / PPPoE            Ops tasks
       |                         |
       +-------------------------+
                  |
             EVENT BUS
                  |
      +-----------+-------------+----------------+
      |                         |                |
   AUDIT                     RECORDINGS       REPORTING
      |                         |                |
 customer history         call archive      daily reports
 support timeline                            analytics
                  |
             ESCALATION
                  |
       Admin / technician / billing
       call transfer / outbound call
```

## Key design rules

1. **Multi-tenant from day one.** Every customer, interaction, case, job, policy and integration is tenant-scoped.
2. **Channels are adapters.** Vapi and WhatsApp never contain business logic.
3. **Event driven.** Important lifecycle changes emit durable domain events so onboarding, reporting, callbacks and analytics can subscribe independently.
4. **AI proposes; policy authorizes.** High-impact actions are controlled by deterministic policy outside the model.
5. **Billing remains authoritative.** Nexa consumes restricted billing APIs rather than editing production database rows directly.
6. **Network management remains bounded.** MikroTik/RADIUS actions use scoped gateways and approved operations.
7. **Every action is auditable.** Who/what requested it, what Nexa decided, what tool ran, and what happened must be recoverable.
8. **Long-running jobs survive phone calls.** A Vapi call can end while a job continues; callbacks can occur on completion, failure or approval.
9. **Human handoff is first-class.** Escalation is not a failure path bolted on later.
10. **Provider independence.** Vapi, WhatsApp provider, storage, queue and AI implementation should be replaceable behind interfaces.

## Core domain objects

- Tenant
- TenantConfig
- CustomerReference
- Interaction
- ConversationMessage
- SupportCase
- NexaJob
- Approval
- AuditRecord
- Recording
- EscalationTarget
- DomainEvent
- DailyReport

These domain concepts should remain stable even if external providers change.

## Infrastructure later

For production, the initial in-memory event bus should be replaced by a durable queue/event system. Interaction, support-case, job and audit stores should be persistent. Exact infrastructure will be selected when the dedicated Nexa server is provisioned.
