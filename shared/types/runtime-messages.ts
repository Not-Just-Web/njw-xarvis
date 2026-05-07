import type { ContextEvent } from '../chat-session/types';
import type { ProviderId } from '../provider-contract/types';

export type RuntimeMessageType =
  | 'provider.setActive'
  | 'provider.getActive'
  | 'provider.connect'
  | 'provider.disconnect'
  | 'provider.getAuthStatus'
  | 'chat.send'
  | 'chat.healthCheck';

export type RuntimeMessageEnvelope<TType extends RuntimeMessageType, TPayload> = {
  type: TType;
  payload: TPayload;
};

export type SetActiveProviderMessage = RuntimeMessageEnvelope<
  'provider.setActive',
  { providerId: ProviderId }
>;

export type GetActiveProviderMessage = RuntimeMessageEnvelope<'provider.getActive', Record<string, never>>;

export type ConnectProviderMessage = RuntimeMessageEnvelope<
  'provider.connect',
  {
    providerId: ProviderId;
    apiKey: string;
  }
>;

export type DisconnectProviderMessage = RuntimeMessageEnvelope<
  'provider.disconnect',
  {
    providerId: ProviderId;
  }
>;

export type GetProviderAuthStatusMessage = RuntimeMessageEnvelope<
  'provider.getAuthStatus',
  {
    providerId: ProviderId;
  }
>;

export type SendChatMessage = RuntimeMessageEnvelope<
  'chat.send',
  {
    sessionId: string;
    prompt: string;
    context: ContextEvent[];
  }
>;

export type HealthCheckMessage = RuntimeMessageEnvelope<'chat.healthCheck', { ping: true }>;

export type RuntimeMessage =
  | SetActiveProviderMessage
  | GetActiveProviderMessage
  | ConnectProviderMessage
  | DisconnectProviderMessage
  | GetProviderAuthStatusMessage
  | SendChatMessage
  | HealthCheckMessage;

export const isRuntimeMessage = (value: unknown): value is RuntimeMessage => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as { type?: unknown; payload?: unknown };
  return typeof candidate.type === 'string' && candidate.payload !== undefined;
};
