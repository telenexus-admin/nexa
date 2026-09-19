# Nexa architecture

## Purpose

Nexa is the independent customer-care and operations plane for Telenexus systems.

The billing/RADIUS server remains the protected system of record. Nexa communicates with it through a narrow authenticated internal API and does not require direct production database access.

## Initial deployment

```text
Customers / Alex
      |
  Vapi / WhatsApp
      |
     Nexa
      |
  +---+-------------------+
  |                       |
Billing internal API   Network operations API
  |                       |
Billing + RADIUS       WireGuard -> MikroTik
  |
PostgreSQL

Nexa -> Codex orchestration (engineering/operations tasks)
```

## Customer reconnection flow

1. Receive a call or WhatsApp message.
2. Resolve tenant and customer identity.
3. Verify the customer using approved factors.
4. Read service, balance and payment state from the billing API.
5. If policy allows reconnection, request it through the billing API.
6. Billing performs the authoritative state change and RADIUS synchronization.
7. Nexa verifies the result through billing/network health signals.
8. Tell the customer the verified outcome or create/escalate a ticket.
9. Persist an audit record of the request, decision, action and result.

## Trust boundaries

### Nexa may eventually
- read customer/service state through scoped APIs;
- request approved reconnection workflows;
- read RADIUS/router health;
- create support incidents;
- submit bounded Codex tasks;
- request human approval for sensitive actions.

### Nexa should not
- receive a PostgreSQL superuser credential;
- expose RouterOS management interfaces publicly;
- execute arbitrary shell commands from Vapi/WhatsApp input;
- treat caller ID alone as sufficient authorization for sensitive account changes;
- deploy arbitrary Codex changes directly to production without release policy.

## Next integration milestone

Before implementing live customer reconnection, synchronize the production billing/RADIUS application source with its GitHub repository. Then define the smallest internal API needed by Nexa:

- customer lookup by normalized phone number;
- account/service status;
- latest payment and outstanding balance;
- reconnect request;
- reconnection verification;
- ticket creation.

Nexa will consume those contracts rather than relying on billing database internals.
