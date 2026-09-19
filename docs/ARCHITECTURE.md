# Nexa architecture

## Purpose

Nexa is the independent customer-care and operations plane for Telenexus systems.

The billing/RADIUS server remains the protected system of record. Nexa communicates with it through narrow authenticated internal APIs and does not require direct production database access.

## Platform shape

```text
Customers / Administrators
        |
 Vapi / WhatsApp / SMS
        |
 Channel adapters
        |
 Nexa Orchestrator
        |
 +------+----------------+----------------+----------------+
 |                       |                |                |
Workflow engine      Policy engine    Event bus       Support cases
 |                       |                |                |
 +-----------+-----------+----------------+----------------+
             |
 +-----------+------------------+-------------------------+
 |                              |                         |
Billing gateway            Network gateway          Codex gateway
 |                              |                         |
Billing / Payments         RADIUS / WireGuard       engineering /
Customer / Invoice         MikroTik / PPPoE         operations jobs
 |                              |
 PostgreSQL                  Routers
             |
 +-----------+-----------------------------+
 |              |             |            |
Telephony     Messaging    Audit       Recording /
calls/transfers WhatsApp    history     transcripts
 |
Escalation / callbacks / daily reports
```

## Architectural guarantees

### Multi-tenant
Every interaction, customer reference, case, job, workflow, policy, escalation and integration is tenant scoped.

### Channel independence
Vapi and WhatsApp are adapters only. Customer-care logic belongs to the orchestrator and resolution engine, so adding/replacing a channel does not rewrite support workflows.

### Durable long-running work
A call may end while Nexa continues reconnecting a customer, waiting for approval, running a network check or waiting for Codex. The workflow can later trigger an outbound callback.

### Event-driven automation
Important lifecycle events can independently trigger automation. For example:

```text
customer.first_purchase.detected
    -> onboarding workflow
    -> Vapi welcome call
    -> WhatsApp support-number message
    -> audit
```

Support completion can independently trigger customer summaries, recordings/transcripts, analytics and daily reporting.

### Human handoff is first-class
Escalation may choose an administrator, technician, billing officer or support agent, transfer an active call, place a new outbound call, or send context through messaging. The support case survives the handoff.

### AI is not the authorization layer
Models may interpret requests, diagnose problems and propose actions. Deterministic policy decides whether actions are allowed, require approval, or are denied.

### Reliability
Webhook, payment and reconnection side effects must be idempotent. Operations that could race should use scoped locks. Production event/workflow infrastructure must eventually be durable rather than in-memory.

## Customer reconnection flow

1. Receive a call or WhatsApp message.
2. Resolve tenant and customer identity.
3. Verify the customer using approved factors.
4. Read service, balance and payment state from the billing API.
5. If policy allows reconnection, request it through the billing API.
6. Billing performs the authoritative state change and RADIUS synchronization.
7. Nexa verifies the result through billing/network health signals.
8. Tell the customer the verified outcome or create/escalate a ticket.
9. Persist an audit record and interaction summary.
10. If the customer is no longer on the call, deliver the result through the configured callback/message policy.

## First-purchase onboarding flow

1. Billing emits a first-purchase/first-activation event.
2. Nexa resolves tenant onboarding policy.
3. Nexa places a welcome call and/or sends WhatsApp/SMS.
4. It explains the official support channel and common support capabilities.
5. Delivery/outcome is recorded in the customer interaction history.

## Trust boundaries

### Nexa may eventually
- read customer/service/payment state through scoped APIs;
- request approved reconnection workflows;
- read RADIUS/router health;
- perform explicitly approved bounded network actions;
- create support incidents;
- submit bounded Codex tasks;
- request human approval for sensitive actions;
- transfer or originate support/escalation calls;
- archive call metadata/recordings/transcripts when configured.

### Nexa should not
- receive a PostgreSQL superuser credential;
- expose RouterOS management interfaces publicly;
- execute arbitrary shell commands directly from untrusted Vapi/WhatsApp text;
- treat caller ID alone as sufficient authorization for sensitive account changes;
- deploy arbitrary Codex changes directly to production without release policy.

## Next integration milestone

Before implementing live customer reconnection, synchronize the production billing/RADIUS application source with its GitHub repository. Then define the internal Nexa API for:

- tenant/customer lookup by normalized phone number;
- account/service status;
- latest payment and outstanding balance;
- first-purchase/activation events;
- reconnect request;
- reconnection verification;
- support ticket creation;
- network/RADIUS diagnostic references.

Nexa consumes those contracts rather than relying on billing database internals.
