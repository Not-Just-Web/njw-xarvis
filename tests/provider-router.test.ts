import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ProviderId, ProviderAdapter } from '@ai/shared/provider-contract/types';
import {
  setActiveProvider,
  getActiveProvider,
  listProviders,
  sendWithActiveProvider
} from '@ai/extension/background/provider-router';

describe('provider-router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to default provider
    setActiveProvider('gemini');
  });

  describe('getActiveProvider', () => {
    it('returns default provider gemini', () => {
      expect(getActiveProvider()).toBe('gemini');
    });
  });

  describe('setActiveProvider', () => {
    it('sets and returns the new active provider', () => {
      const result = setActiveProvider('claude');
      expect(result).toBe('claude');
      expect(getActiveProvider()).toBe('claude');
    });

    it('switches between providers', () => {
      setActiveProvider('chatgpt');
      expect(getActiveProvider()).toBe('chatgpt');

      setActiveProvider('gemini');
      expect(getActiveProvider()).toBe('gemini');
    });

    it('throws for an unregistered provider', () => {
      expect(() => setActiveProvider('unknown' as ProviderId)).toThrow('Provider not registered');
    });
  });

  describe('listProviders', () => {
    it('returns all registered providers', () => {
      const providers = listProviders();
      expect(providers.length).toBeGreaterThanOrEqual(3);
      const ids = providers.map((p) => p.id);
      expect(ids).toContain('gemini');
      expect(ids).toContain('claude');
      expect(ids).toContain('chatgpt');
    });

    it('includes id, displayName, and supports for each provider', () => {
      const providers = listProviders();
      for (const p of providers) {
        expect(p.id).toBeDefined();
        expect(p.displayName).toBeDefined();
        expect(p.supports).toBeDefined();
      }
    });
  });

  describe('sendWithActiveProvider', () => {
    it('throws when no adapter available', async () => {
      // Force a bad state by mocking registry
      const { providerRegistry } = await import('@ai/shared/provider-contract/registry');
      const spy = vi.spyOn(providerRegistry, 'get').mockReturnValue(undefined as unknown as ProviderAdapter);

      await expect(
        sendWithActiveProvider({
          sessionId: 'sess-1',
          messages: [{ role: 'user', content: 'hi' }],
          contextEvents: []
        })
      ).rejects.toThrow('No adapter found');

      spy.mockRestore();
    });
  });
});
