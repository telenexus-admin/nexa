# Nexa Agent Platform

Nexa is Telenexus' autonomous, multi-tenant customer-care and operations platform.

It is designed to support voice, WhatsApp, SMS, customer onboarding, automated troubleshooting and reconnection, call transfer/escalation, recordings/transcripts, callbacks, daily reporting, network operations and future Codex-powered engineering/operations workflows.

Nexa is intentionally separated from the billing/RADIUS application. The billing platform remains the authoritative system of record; Nexa talks to it through restricted internal APIs.

## Foundation

The platform is structured around:

- **Channel adapters** — Vapi, WhatsApp, SMS and future channels.
- **Nexa Orchestrator** — shared application flow independent of channel/provider.
- **Durable workflows/jobs** — work may continue after a call or chat ends.
- **Domain event bus** — onboarding, support, reporting and callbacks react to events independently.
- **Support cases and interaction history** — one timeline across voice and messaging.
- **Deterministic policy layer** — AI may propose actions; policy authorizes/denies them.
- **Billing gateway** — customer, payment, invoice, package and reconnection operations.
- **Network gateway** — RADIUS, WireGuard, MikroTik, PPPoE and Hotspot operations.
- **Telephony gateway** — outbound calls and human call transfer.
- **Messaging gateway** — WhatsApp/SMS.
- **Escalation directory** — admin, technician, billing and support routing.
- **Recording/transcript archive** — voice history and support evidence.
- **Audit trail** — every important request/action/result.
- **Callback scheduler** — completion, approval, failure and follow-up calls.
- **Reporting** — customer summaries and daily admin reports.
- **Codex gateway** — future bounded engineering/operations tasks.
- **Idempotency and locking** — prevents duplicate webhook/payment/reconnection side effects.

## Product north star

Nexa should become a powerful ISP support agent capable of resolving the large majority of routine support cases automatically while safely escalating what it cannot resolve.

Examples:

- first-time customer onboarding call/message;
- account/payment questions;
- reconnection and verification;
- RADIUS/PPPoE/Hotspot diagnosis;
- safe MikroTik/network health checks;
- ticket creation;
- warm transfer to a technician or admin;
- customer follow-up;
- voice recording/transcript storage;
- daily support summaries;
- callback when a long-running task completes or needs approval.

See:

- `docs/ECOSYSTEM.md` — long-term Nexa ecosystem and design rules.
- `docs/ARCHITECTURE.md` — integration/trust boundaries.

## Current status

Foundation scaffold only. Provider webhooks are intentionally safe stubs and production billing/network actions are not enabled yet.

No production billing, MikroTik, Vapi, WhatsApp or Codex credentials should be committed to this repository.
