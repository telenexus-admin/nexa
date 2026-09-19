# Nexa Agent Platform

Nexa is Telenexus' operations and customer-care orchestration service.

It is intentionally separated from the billing/RADIUS application. Nexa receives customer and operator requests from channels such as Vapi and WhatsApp, turns them into controlled jobs, calls the billing/network APIs, and can later hand engineering tasks to Codex.

## Initial scope

- Vapi webhook ingress
- WhatsApp webhook ingress
- Customer-care job orchestration
- Billing/RADIUS connector boundary
- MikroTik/WireGuard connector boundary
- Codex task connector boundary
- Health and readiness endpoints
- Audit-friendly job model
- Approval/escalation hooks

## Architecture principle

Nexa must not depend on billing database tables directly. Production billing actions should be exposed through a restricted internal API on the billing server. This keeps the billing/RADIUS core isolated and lets Nexa evolve independently.

See `docs/ARCHITECTURE.md` for the initial design.

## Status

Foundation scaffold. No production billing, MikroTik, Vapi, WhatsApp or Codex credentials are stored in this repository.
