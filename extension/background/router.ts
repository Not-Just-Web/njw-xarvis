import {
  type RuntimeMessage,
  type SendChatMessage,
  type SetActiveProviderMessage,
  type ConnectProviderMessage,
  type DisconnectProviderMessage,
  type GetProviderAuthStatusMessage
} from '../../shared/types/runtime-messages';
import {
  clearProviderAuth,
  getActiveProvider,
  isProviderConnected,
  sendWithActiveProvider,
  setActiveProvider,
  setProviderAuth
} from './provider-router';
import type { ProviderId } from '../../shared/provider-contract/types';

type RuntimeResponse = {
  type: 'response';
  payload: Record<string, unknown>;
};

const toRuntimeResponse = (payload: Record<string, unknown>): RuntimeResponse => ({
  type: 'response',
  payload
});

const handleSetActiveProvider = (message: SetActiveProviderMessage): RuntimeResponse => {
  const providerId = setActiveProvider(message.payload.providerId);
  return toRuntimeResponse({ ok: true, providerId });
};

const getStoredProviderApiKey = async (providerId: ProviderId): Promise<string | null> => {
  const key = `provider_auth_${providerId}`;
  const result = await chrome.storage.local.get(key);
  return (result[key]?.apiKey as string | undefined) ?? null;
};

const handleConnectProvider = async (message: ConnectProviderMessage): Promise<RuntimeResponse> => {
  const providerId = message.payload.providerId;
  const apiKey = message.payload.apiKey.trim();

  if (!apiKey) {
    return toRuntimeResponse({ ok: false, error: 'API key cannot be empty' });
  }

  const authenticated = await setProviderAuth(providerId, { token: apiKey });
  if (!authenticated) {
    return toRuntimeResponse({ ok: false, error: `Failed to authenticate ${providerId}` });
  }

  await chrome.storage.local.set({
    [`provider_auth_${providerId}`]: {
      apiKey,
      connectedAt: Date.now()
    }
  });

  setActiveProvider(providerId);

  return toRuntimeResponse({ ok: true, providerId, connected: true });
};

const handleDisconnectProvider = async (message: DisconnectProviderMessage): Promise<RuntimeResponse> => {
  const providerId = message.payload.providerId;
  clearProviderAuth(providerId);
  await chrome.storage.local.remove(`provider_auth_${providerId}`);

  return toRuntimeResponse({ ok: true, providerId, connected: false });
};

const handleGetProviderAuthStatus = async (
  message: GetProviderAuthStatusMessage
): Promise<RuntimeResponse> => {
  const providerId = message.payload.providerId;

  if (isProviderConnected(providerId)) {
    return toRuntimeResponse({ ok: true, providerId, connected: true });
  }

  const storedApiKey = await getStoredProviderApiKey(providerId);
  if (!storedApiKey) {
    return toRuntimeResponse({ ok: true, providerId, connected: false });
  }

  const authenticated = await setProviderAuth(providerId, { token: storedApiKey });
  return toRuntimeResponse({ ok: true, providerId, connected: authenticated });
};

const handleSendChat = async (message: SendChatMessage): Promise<RuntimeResponse> => {
  const providerId = getActiveProvider();
  const connected = isProviderConnected(providerId);

  if (!connected) {
    const storedApiKey = await getStoredProviderApiKey(providerId);
    if (!storedApiKey || !(await setProviderAuth(providerId, { token: storedApiKey }))) {
      return toRuntimeResponse({
        ok: false,
        providerId,
        error: 'Provider not connected. Open popup and connect first.'
      });
    }
  }

  const response = await sendWithActiveProvider({
    sessionId: message.payload.sessionId,
    messages: [{ role: 'user', content: message.payload.prompt }],
    contextEvents: message.payload.context.map((item) => item.label)
  });

  return toRuntimeResponse({
    ok: true,
    providerId,
    text: response.text,
    model: response.model
  });
};

export const routeRuntimeMessage = async (message: RuntimeMessage): Promise<RuntimeResponse> => {
  switch (message.type) {
    case 'provider.setActive':
      return handleSetActiveProvider(message);

    case 'provider.getActive':
      return toRuntimeResponse({ ok: true, providerId: getActiveProvider() });

    case 'provider.connect':
      return handleConnectProvider(message);

    case 'provider.disconnect':
      return handleDisconnectProvider(message);

    case 'provider.getAuthStatus':
      return handleGetProviderAuthStatus(message);

    case 'chat.send':
      return handleSendChat(message);

    case 'chat.healthCheck':
      return toRuntimeResponse({ ok: true, providerId: getActiveProvider(), status: 'healthy' });

    default:
      return toRuntimeResponse({ ok: false, error: 'Unsupported runtime message' });
  }
};
