import type { ProviderAdapter, ProviderId, ProviderSendPayload, ProviderSendResult } from '../../shared/provider-contract/types';

const createMockAdapter = (id: ProviderId, displayName: string): ProviderAdapter => ({
  id,
  displayName,
  supports: {
    vision: true,
    tools: false,
    maxContextBytes: 300000
  },
  async authenticate() {
    return true;
  },
  async sendMessage(payload: ProviderSendPayload): Promise<ProviderSendResult> {
    return {
      text: `Mock response from ${displayName}: ${payload.messages.at(-1)?.content ?? ''}`,
      model: `${id}-mock-v1`
    };
  }
});

const providerMap: Record<ProviderId, ProviderAdapter> = {
  gemini: createMockAdapter('gemini', 'Gemini'),
  claude: createMockAdapter('claude', 'Claude'),
  chatgpt: createMockAdapter('chatgpt', 'ChatGPT')
};

let activeProviderId: ProviderId = 'gemini';

export const setActiveProvider = (providerId: ProviderId): ProviderId => {
  if (!providerMap[providerId]) {
    throw new Error(`Provider not registered: ${providerId}`);
  }

  activeProviderId = providerId;
  return activeProviderId;
};

export const getActiveProvider = (): ProviderId => {
  return activeProviderId;
};

export const sendWithActiveProvider = async (
  payload: ProviderSendPayload
): Promise<ProviderSendResult> => {
  const adapter = providerMap[activeProviderId];
  if (!adapter) {
    throw new Error(`No adapter found for provider: ${activeProviderId}`);
  }

  return adapter.sendMessage(payload);
};
