export type CodexTaskState =
  | "queued"
  | "running"
  | "needs_approval"
  | "completed"
  | "failed";

export interface CodexTask {
  taskId: string;
  state: CodexTaskState;
  summary?: string;
}

/**
 * Nexa-facing Codex contract.
 *
 * The concrete SDK/App Server integration will live behind this interface so
 * customer-care code never depends directly on Codex implementation details.
 */
export interface CodexGateway {
  createTask(instruction: string, project?: string): Promise<CodexTask>;
  getTask(taskId: string): Promise<CodexTask>;
  approveTask(taskId: string, approvalId: string): Promise<CodexTask>;
}
