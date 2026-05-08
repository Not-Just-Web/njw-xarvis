import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createCustomProviderAdapter, validateCustomProviderDefinition } from '../shared/provider-contract/custom-provider';
import type { CustomProviderDefinition } from '../shared/provider-contract/custom-provider';

describe('custom-provider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateCustomProviderDefinition', () => {
    it('should validate a complete custom provider definition', () => {
      const def: CustomProviderDefinition = {
        id: 'my-provider',
        displayName: 'My Provider',
        endpoint: 'https://api.example.com',
        authType: 'api-key',
        modelList: ['model-a', 'model-b'],
        capabilities: {
          vision: true,
          tools: true,
          maxContextBytes: 8192,
        },
      };

      const error = validateCustomProviderDefinition(def);
      expect(error).toBeNull();
    });

    it('should reject invalid provider ID', () => {
      const def: Partial<CustomProviderDefinition> = {
        id: 'my_provider', // underscores not allowed
        displayName: 'Test',
        endpoint: 'https://api.example.com',
        authType: 'api-key',
        modelList: ['model-a'],
        capabilities: { vision: false, tools: false, maxContextBytes: 4096 },
      };

      const error = validateCustomProviderDefinition(def);
      expect(error).toContain('lowercase letters, numbers, and hyphens');
    });

    it('should reject missing display name', () => {
      const def: Partial<CustomProviderDefinition> = {
        id: 'test',
        displayName: '',
        endpoint: 'https://api.example.com',
        authType: 'api-key',
        modelList: ['model-a'],
        capabilities: { vision: false, tools: false, maxContextBytes: 4096 },
      };

      const error = validateCustomProviderDefinition(def);
      expect(error).toContain('Display name is required');
    });

    it('should reject invalid endpoint URL', () => {
      const def: Partial<CustomProviderDefinition> = {
        id: 'test',
        displayName: 'Test',
        endpoint: 'not-a-url',
        authType: 'api-key',
        modelList: ['model-a'],
        capabilities: { vision: false, tools: false, maxContextBytes: 4096 },
      };

      const error = validateCustomProviderDefinition(def);
      expect(error).toContain('valid HTTP(S) URL');
    });

    it('should reject invalid auth type', () => {
      const def: Partial<CustomProviderDefinition> = {
        id: 'test',
        displayName: 'Test',
        endpoint: 'https://api.example.com',
        authType: 'invalid' as Record<string, unknown>,
        modelList: ['model-a'],
        capabilities: { vision: false, tools: false, maxContextBytes: 4096 },
      };

      const error = validateCustomProviderDefinition(def);
      expect(error).toContain('Auth type must be one of');
    });

    it('should reject empty model list', () => {
      const def: Partial<CustomProviderDefinition> = {
        id: 'test',
        displayName: 'Test',
        endpoint: 'https://api.example.com',
        authType: 'api-key',
        modelList: [],
        capabilities: { vision: false, tools: false, maxContextBytes: 4096 },
      };

      const error = validateCustomProviderDefinition(def);
      expect(error).toContain('At least one model');
    });

    it('should reject missing capabilities', () => {
      const def: Partial<CustomProviderDefinition> = {
        id: 'test',
        displayName: 'Test',
        endpoint: 'https://api.example.com',
        authType: 'api-key',
        modelList: ['model-a'],
      };

      const error = validateCustomProviderDefinition(def);
      expect(error).toContain('Capabilities are required');
    });
  });

  describe('createCustomProviderAdapter', () => {
    const mockDefinition: CustomProviderDefinition = {
      id: 'test-provider',
      displayName: 'Test Provider',
      endpoint: 'https://api.example.com',
      authType: 'api-key',
      modelList: ['gpt-3.5', 'gpt-4'],
      capabilities: {
        vision: true,
        tools: true,
        maxContextBytes: 8192,
      },
    };

    it('should create adapter with correct metadata', () => {
      const adapter = createCustomProviderAdapter(mockDefinition);

      expect(adapter.id).toBe('custom:test-provider');
      expect(adapter.displayName).toBe('Test Provider');
      expect(adapter.supports).toEqual(mockDefinition.capabilities);
    });

    it('should authenticate with api-key auth type', async () => {
      const adapter = createCustomProviderAdapter(mockDefinition);

      class MockResponse {
        status: number;
        constructor(_body: string, opts: { status: number }) {
          this.status = opts.status;
        }
        get ok() { return this.status === 200; }
        async json() { return {}; }
      }
      global.Response = MockResponse as any;
      global.fetch = vi.fn().mockResolvedValueOnce(new MockResponse('', { status: 200 }));

      const result = await adapter.authenticate({
        token: 'test-api-key',
      });

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/health',
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-API-Key': 'test-api-key',
          }),
        })
      );
    });

    it('should authenticate with bearer token', async () => {
      const bearerDef: CustomProviderDefinition = {
        ...mockDefinition,
        authType: 'bearer',
      };
      const adapter = createCustomProviderAdapter(bearerDef);

      class MockResponse {
        status: number;
        constructor(_body: string, opts: { status: number }) {
          this.status = opts.status;
        }
        get ok() { return this.status === 200; }
        async json() { return {}; }
      }
      global.Response = MockResponse as any;
      global.fetch = vi.fn().mockResolvedValueOnce(new MockResponse('', { status: 200 }));

      const result = await adapter.authenticate({
        token: 'test-bearer-token',
      });

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/health',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-bearer-token',
          }),
        })
      );
    });

    it('should handle authentication failure', async () => {
      const adapter = createCustomProviderAdapter(mockDefinition);

      global.fetch = vi.fn().mockResolvedValueOnce(
        new Response('', { status: 401 })
      );

      const result = await adapter.authenticate({
        token: 'bad-key',
      });

      expect(result).toBe(false);
    });

    it('should send message with OpenAI-compatible format', async () => {
      const adapter = createCustomProviderAdapter(mockDefinition);

      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Test response',
            },
          },
        ],
        model: 'gpt-3.5',
        usage: { total_tokens: 100 },
      };

      class MockResponse {
        status: number;
        constructor(_body: string, opts: { status: number }) {
          this.status = opts.status;
        }
        get ok() { return this.status === 200; }
        async json() { return mockResponse; }
      }
      global.Response = MockResponse as any;
      global.fetch = vi.fn().mockResolvedValueOnce(new MockResponse('', { status: 200 }));

      const payload = {
        sessionId: 'sess-123',
        messages: [
          { role: 'user' as const, content: 'Hello' },
        ],
        contextEvents: [],
      };

      const result = await adapter.sendMessage(payload);

      expect(result.text).toBe('Test response');
      expect(result.model).toBe('gpt-3.5');
      expect(result.tokensUsed).toBe(100);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/chat/completions',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('messages'),
        })
      );
    });

    it('should handle provider errors gracefully', async () => {
      const adapter = createCustomProviderAdapter(mockDefinition);

      global.fetch = vi.fn().mockResolvedValueOnce(
        new Response('', { status: 500, statusText: 'Internal Server Error' })
      );

      const payload = {
        sessionId: 'sess-123',
        messages: [
          { role: 'user' as const, content: 'Hello' },
        ],
        contextEvents: [],
      };

      await expect(adapter.sendMessage(payload)).rejects.toThrow(
        /Failed to send message/
      );
    });

    it('should use first model from list as default', async () => {
      const adapter = createCustomProviderAdapter(mockDefinition);

      const mockResponse = {
        choices: [{ message: { content: 'Response' } }],
        model: 'gpt-3.5',
      };

      class MockResponse {
        status: number;
        constructor(_body: string, opts: { status: number }) {
          this.status = opts.status;
        }
        get ok() { return this.status === 200; }
        async json() { return mockResponse; }
      }
      global.Response = MockResponse as any;
      global.fetch = vi.fn().mockResolvedValueOnce(new MockResponse('', { status: 200 }));

      const payload = {
        sessionId: 'sess-123',
        messages: [{ role: 'user' as const, content: 'Hello' }],
        contextEvents: [],
      };

      await adapter.sendMessage(payload);

      const callArgs = (global.fetch as Record<string, unknown>).mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);
      expect(requestBody.model).toBe('gpt-3.5');
    });
  });
});
