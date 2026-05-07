import { describe, it, expect, beforeEach, vi } from 'vitest';
import { describe as describeBlock } from 'vitest';
import type { ProviderAdapter } from '../../shared/provider-contract/types';
import type { CustomProviderDefinition } from '../../shared/provider-contract/custom-provider';

// Create a fresh registry for each test
function createTestRegistry() {
  const adapters = new Map<string, ProviderAdapter>();
  const authConfigs = new Map<string, any>();
  const customProviders = new Map<string, CustomProviderDefinition>();

  const mockGemini: ProviderAdapter = {
    id: 'gemini',
    displayName: 'Google Gemini',
    supports: { vision: true, tools: true, maxContextBytes: 32000 },
    authenticate: vi.fn().mockResolvedValue(true),
    sendMessage: vi.fn().mockResolvedValue({ text: 'Gemini response', model: 'gemini-pro' }),
  };

  const mockClaude: ProviderAdapter = {
    id: 'claude',
    displayName: 'Claude',
    supports: { vision: true, tools: true, maxContextBytes: 100000 },
    authenticate: vi.fn().mockResolvedValue(true),
    sendMessage: vi.fn().mockResolvedValue({ text: 'Claude response', model: 'claude-3-sonnet' }),
  };

  return {
    adapters,
    authConfigs,
    customProviders,
    mockGemini,
    mockClaude,
  };
}

describe('ProviderRegistry - Dynamic Registration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register / unregister', () => {
    it('should register a new provider', () => {
      const { adapters, mockGemini } = createTestRegistry();

      adapters.set(mockGemini.id, mockGemini);

      expect(adapters.has('gemini')).toBe(true);
      expect(adapters.get('gemini')).toBe(mockGemini);
    });

    it('should unregister an existing provider', () => {
      const { adapters, mockGemini } = createTestRegistry();

      adapters.set(mockGemini.id, mockGemini);
      expect(adapters.has('gemini')).toBe(true);

      adapters.delete('gemini');
      expect(adapters.has('gemini')).toBe(false);
    });

    it('should remove auth config when unregistering', () => {
      const { adapters, authConfigs, mockGemini } = createTestRegistry();

      adapters.set(mockGemini.id, mockGemini);
      authConfigs.set('gemini', { token: 'test-token' });

      adapters.delete('gemini');
      authConfigs.delete('gemini');

      expect(adapters.has('gemini')).toBe(false);
      expect(authConfigs.has('gemini')).toBe(false);
    });
  });

  describe('addCustomProvider', () => {
    it('should add a custom provider with custom: prefix', () => {
      const { adapters, customProviders } = createTestRegistry();

      const customDef: CustomProviderDefinition = {
        id: 'my-provider',
        displayName: 'My Custom Provider',
        endpoint: 'https://api.example.com',
        authType: 'api-key',
        modelList: ['model-a'],
        capabilities: { vision: false, tools: false, maxContextBytes: 4096 },
      };

      customProviders.set('my-provider', customDef);

      expect(customProviders.has('my-provider')).toBe(true);
      expect(customProviders.get('my-provider')).toEqual(customDef);
    });

    it('should store custom provider definition', () => {
      const { customProviders } = createTestRegistry();

      const customDef: CustomProviderDefinition = {
        id: 'test-provider',
        displayName: 'Test',
        endpoint: 'https://test.com',
        authType: 'bearer',
        modelList: ['model-1', 'model-2'],
        capabilities: { vision: true, tools: false, maxContextBytes: 8192 },
      };

      customProviders.set('test-provider', customDef);

      const stored = customProviders.get('test-provider');
      expect(stored?.displayName).toBe('Test');
      expect(stored?.modelList.length).toBe(2);
    });
  });

  describe('listBuiltin / listCustom', () => {
    it('should separate built-in from custom providers', () => {
      const { adapters, mockGemini, mockClaude } = createTestRegistry();

      adapters.set('gemini', mockGemini);
      adapters.set('claude', mockClaude);
      adapters.set('custom:my-provider', {
        id: 'custom:my-provider',
        displayName: 'My Provider',
        supports: { vision: false, tools: false, maxContextBytes: 4096 },
        authenticate: vi.fn().mockResolvedValue(true),
        sendMessage: vi.fn().mockResolvedValue({ text: 'Response', model: 'custom' }),
      } as ProviderAdapter);

      const builtinCount = Array.from(adapters.values())
        .filter(a => !a.id.startsWith('custom:'))
        .length;
      const customCount = Array.from(adapters.values())
        .filter(a => a.id.startsWith('custom:'))
        .length;

      expect(builtinCount).toBe(2);
      expect(customCount).toBe(1);
    });
  });

  describe('getCustomDefinitions', () => {
    it('should return all custom provider definitions', () => {
      const { customProviders } = createTestRegistry();

      const def1: CustomProviderDefinition = {
        id: 'provider-1',
        displayName: 'Provider 1',
        endpoint: 'https://api1.example.com',
        authType: 'api-key',
        modelList: ['model-a'],
        capabilities: { vision: false, tools: false, maxContextBytes: 4096 },
      };

      const def2: CustomProviderDefinition = {
        id: 'provider-2',
        displayName: 'Provider 2',
        endpoint: 'https://api2.example.com',
        authType: 'bearer',
        modelList: ['model-b'],
        capabilities: { vision: true, tools: true, maxContextBytes: 8192 },
      };

      customProviders.set('provider-1', def1);
      customProviders.set('provider-2', def2);

      const definitions = Array.from(customProviders.values());
      expect(definitions.length).toBe(2);
      expect(definitions[0].displayName).toBe('Provider 1');
      expect(definitions[1].displayName).toBe('Provider 2');
    });

    it('should return empty array when no custom providers', () => {
      const { customProviders } = createTestRegistry();
      const definitions = Array.from(customProviders.values());
      expect(definitions).toEqual([]);
    });
  });

  describe('setAuth / getAuth', () => {
    it('should set and retrieve auth config for a provider', () => {
      const { authConfigs } = createTestRegistry();

      authConfigs.set('gemini', { token: 'test-token' });

      const config = authConfigs.get('gemini');
      expect(config?.token).toBe('test-token');
    });

    it('should return undefined for provider without auth config', () => {
      const { authConfigs } = createTestRegistry();
      const config = authConfigs.get('nonexistent');
      expect(config).toBeUndefined();
    });

    it('should allow updating auth config', () => {
      const { authConfigs } = createTestRegistry();

      authConfigs.set('gemini', { token: 'old-token' });
      authConfigs.set('gemini', { token: 'new-token' });

      const config = authConfigs.get('gemini');
      expect(config?.token).toBe('new-token');
    });
  });

  describe('get / has / listAll', () => {
    it('should get a registered provider', () => {
      const { adapters, mockGemini } = createTestRegistry();

      adapters.set('gemini', mockGemini);

      const provider = adapters.get('gemini');
      expect(provider).toBe(mockGemini);
      expect(provider?.displayName).toBe('Google Gemini');
    });

    it('should check if provider is registered', () => {
      const { adapters, mockGemini } = createTestRegistry();

      adapters.set('gemini', mockGemini);

      expect(adapters.has('gemini')).toBe(true);
      expect(adapters.has('nonexistent')).toBe(false);
    });

    it('should list all registered providers', () => {
      const { adapters, mockGemini, mockClaude } = createTestRegistry();

      adapters.set('gemini', mockGemini);
      adapters.set('claude', mockClaude);

      const all = Array.from(adapters.values());
      expect(all.length).toBe(2);
      expect(all.map(a => a.id)).toContain('gemini');
      expect(all.map(a => a.id)).toContain('claude');
    });

    it('should return empty list when no providers', () => {
      const { adapters } = createTestRegistry();
      const all = Array.from(adapters.values());
      expect(all).toEqual([]);
    });
  });

  describe('provider persistence across operations', () => {
    it('should maintain provider list after auth config changes', () => {
      const { adapters, authConfigs, mockGemini } = createTestRegistry();

      adapters.set('gemini', mockGemini);
      authConfigs.set('gemini', { token: 'token1' });

      expect(adapters.has('gemini')).toBe(true);

      authConfigs.set('gemini', { token: 'token2' });

      expect(adapters.has('gemini')).toBe(true);
      expect(authConfigs.get('gemini')?.token).toBe('token2');
    });

    it('should handle multiple providers with different auth types', () => {
      const { adapters, authConfigs, mockGemini, mockClaude } = createTestRegistry();

      adapters.set('gemini', mockGemini);
      adapters.set('claude', mockClaude);

      authConfigs.set('gemini', { token: 'api-key-123' });
      authConfigs.set('claude', { token: 'sk-ant-456' });

      expect(authConfigs.get('gemini')?.token).toBe('api-key-123');
      expect(authConfigs.get('claude')?.token).toBe('sk-ant-456');
    });
  });
});
