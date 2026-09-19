export type RiskLevel = "read_only" | "low" | "medium" | "high" | "prohibited";

export interface ActionPolicyInput {
  tenantId: string;
  action: string;
  risk: RiskLevel;
  customerVerified: boolean;
  productionImpact?: boolean;
  metadata?: Record<string, unknown>;
}

export type ActionPolicyDecision =
  | { decision: "allow"; reason: string }
  | { decision: "require_approval"; reason: string; approvalRole?: string }
  | { decision: "deny"; reason: string };

/**
 * Policy evaluation is deliberately isolated from the AI model.
 * The model may propose an action; deterministic policy decides whether
 * Nexa may execute it, pause for approval, or reject it.
 */
export interface ActionPolicy {
  evaluate(input: ActionPolicyInput): Promise<ActionPolicyDecision>;
}
