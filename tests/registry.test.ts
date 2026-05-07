import { describe, it, expect } from 'vitest';
import { providerRegistry } from '../shared/provider-contract/registry';
import type { ProviderAdapter, ProviderId } from '../shared/provider-contract/types';

describe('Provider Registry', () => {
  it('should list all registered providers', () => {
    const providers = providerRegistry.listAll();

    expect(providers.length).toBeGreaterThanOrEqual(3);
    expect(providers.map((p) => p.id)).toContain('gemini');
    expect(providers.map((p) => p.id)).toContain('claude');
    expect(providers.map((p) => p.id)).toContain('chatgpt');
  });

  it('should get provider by id', () => {
    const gemini = providerRegistry.get('gemini');

    expect(gemini).toBeDefined();
    expect(gemini?.displayName).toBe('Google Gemini');
  });

  it('should return undefined for unknown provider', () => {
    const unknownId = 'unknown' as ProviderId;
    const unknown = providerRegistry.get(unknownId);

    expect(unknown).toBeUndefined();
  });

  it('should check if provider exists', () => {
    expect(providerRegistry.has('gemini')).toBe(true);
    const unknownId = 'unknown' as ProviderId;
    expect(providerRegistry.has(unknownId)).toBe(false);
  });

  it('should set and get auth config', () => {
    const config = { token: 'test-token-123' };

    providerRegistry.setAuth('gemini', config);
    const retrieved = providerRegistry.getAuth('gemini');

    expect(retrieved).toEqual(config);
  });

  it('should return false if no auth config exists', async () => {
    const result = await providerRegistry.authenticate('chatgpt');

    expect(result).toBe(false);
  });

  it('should return false for unknown provider authentication', async () => {
    const unknownId = 'unknown' as ProviderId;
    const result = await providerRegistry.authenticate(unknownId);

    expect(result).toBe(false);
  });

  it('should register custom provider', () => {
    const customId = 'custom:test-provider' as ProviderId;
    const customAdapter: ProviderAdapter = {
      id: customId,
      displayName: 'Test Provider',
      supports: { vision: false, tools: false, maxContextBytes: 50000 },
      async authenticate() {
        return true;
      },
      async sendMessage() {
        return { text: 'Test response', model: 'test-v1' };
      }
    };

    providerRegistry.register(customAdapter);

    expect(providerRegistry.has(customId)).toBe(true);
    expect(providerRegistry.get(customId)).toBeDefined();
  });

  it('should track auth for multiple providers', () => {
    const config1 = { token: 'key-1' };
    const config2 = { token: 'key-2' };

    providerRegistry.setAuth('gemini', config1);
    providerRegistry.setAuth('claude', config2);

    expect(providerRegistry.getAuth('gemini')).toEqual(config1);
    expect(providerRegistry.getAuth('claude')).toEqual(config2);
  });
});
