export interface AiProposedAction {
  kind: 'create_booking' | 'cancel_booking' | string;
  payload?: Record<string, unknown>;
}

export interface AiMessageExtraV1 {
  schemaVersion: 1;
  aiPlatform?: boolean;
  streamStatus?: 'thinking' | 'streaming' | 'completed' | 'failed';
  requiresConfirmation?: boolean;
  resolved?: boolean;
  proposedAction?: AiProposedAction | null;
  traceId?: string;
  expiresAt?: string;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : null;
}

export function readAiMessageExtra(message: unknown): AiMessageExtraV1 | null {
  const root = asRecord(message);
  if (!root) return null;
  const nested = asRecord(root.extra);
  const candidate = nested ?? root;
  if (candidate.schemaVersion !== 1) return null;
  return candidate as unknown as AiMessageExtraV1;
}

