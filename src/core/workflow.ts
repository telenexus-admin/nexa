export type WorkflowStatus =
  | "pending"
  | "running"
  | "waiting"
  | "needs_approval"
  | "completed"
  | "failed"
  | "cancelled";

export interface WorkflowInstance<TState extends Record<string, unknown> = Record<string, unknown>> {
  id: string;
  tenantId: string;
  workflowType: string;
  status: WorkflowStatus;
  correlationId?: string;
  state: TState;
  createdAt: string;
  updatedAt: string;
  wakeAt?: string;
}

export interface WorkflowContext {
  tenantId: string;
  workflowId: string;
  correlationId?: string;
}

export interface WorkflowDefinition<TInput = unknown, TResult = unknown> {
  type: string;
  start(input: TInput, context: WorkflowContext): Promise<TResult>;
}

export interface WorkflowStore {
  create(instance: WorkflowInstance): Promise<void>;
  update(instance: WorkflowInstance): Promise<void>;
  get(workflowId: string): Promise<WorkflowInstance | null>;
}

export interface WorkflowEngine {
  start<TInput>(workflowType: string, input: TInput, tenantId: string): Promise<{ workflowId: string }>;
  resume(workflowId: string, signal: string, payload?: unknown): Promise<void>;
  cancel(workflowId: string, reason?: string): Promise<void>;
}

/**
 * Production workflows must be durable: a customer may hang up while a
 * reconnection, approval, technician escalation or Codex job continues.
 */
