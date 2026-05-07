import type { CapturedContext } from '../content-script/selection';
import type { ContextEvent } from '../../shared/chat-session/types';

const generateId = (): string =>
  `ctx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

export const normalizeToContextEvent = (
  captured: CapturedContext,
  sessionId: string
): ContextEvent => ({
  id: generateId(),
  sessionId,
  type: captured.type,
  label: captured.label,
  payload: captured.payload,
  createdAt: new Date().toISOString()
});

export const sanitizePayload = (raw: string): string => {
  // Truncate overly large payloads to prevent API abuse.
  const MAX_PAYLOAD_BYTES = 50_000;
  if (raw.length > MAX_PAYLOAD_BYTES) {
    return raw.slice(0, MAX_PAYLOAD_BYTES) + '[truncated]';
  }

  return raw;
};
