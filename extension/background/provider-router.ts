import type { ProviderId, ProviderSendPayload, ProviderSendResult, ProviderAuthConfig } from '../../shared/provider-contract/types';
import { providerRegistry } from '../../shared/provider-contract/registry';

let activeProviderId: ProviderId = 'gemini';
const connectedProviders = new Set<ProviderId>();

export const setActiveProvider = (providerId: ProviderId): ProviderId => {
  if (!providerRegistry.has(providerId)) {
    throw new Error(`Provider not registered: ${providerId}`);
  }

  activeProviderId = providerId;
  console.log(`[ProviderRouter] Active provider set to: ${providerId}`);
  return activeProviderId;
};

export const getActiveProvider = (): ProviderId => {
  return activeProviderId;
};

export const listProviders = () => {
  return providerRegistry.listAll().map((adapter) => ({
    id: adapter.id,
    displayName: adapter.displayName,
    supports: adapter.supports
  }));
};

export const setProviderAuth = async (providerId: ProviderId, config: ProviderAuthConfig): Promise<boolean> => {
  providerRegistry.setAuth(providerId, config);
  const authenticated = await providerRegistry.authenticate(providerId);

  if (authenticated) {
    connectedProviders.add(providerId);
  } else {
    connectedProviders.delete(providerId);
  }

  return authenticated;
};

export const clearProviderAuth = (providerId: ProviderId): void => {
  providerRegistry.setAuth(providerId, { token: '' });
  connectedProviders.delete(providerId);
};

export const isProviderConnected = (providerId: ProviderId): boolean => {
  return connectedProviders.has(providerId);
};

export const sendWithActiveProvider = async (
  payload: ProviderSendPayload
): Promise<ProviderSendResult> => {
  const adapter = providerRegistry.get(activeProviderId);
  if (!adapter) {
    throw new Error(`No adapter found for provider: ${activeProviderId}`);
  }

  return adapter.sendMessage(payload);
};
