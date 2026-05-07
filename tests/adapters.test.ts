import { describe, it, expect, afterEach, vi } from 'vitest';
import { geminiAdapter } from '../extension/providers/gemini/adapter';
import { claudeAdapter } from '../extension/providers/claude/adapter';
import { chatgptAdapter } from '../extension/providers/chatgpt/adapter';

describe('Provider Adapters', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Gemini Adapter', () => {
    it('should have correct metadata', () => {
      expect(geminiAdapter.id).toBe('gemini');
      expect(geminiAdapter.displayName).toBe('Google Gemini');
      expect(geminiAdapter.supports.vision).toBe(true);
      expect(geminiAdapter.supports.maxContextBytes).toBe(1000000);
    });

    it('should fail auth without token', async () => {
      const result = await geminiAdapter.authenticate({ token: '' });
      expect(result).toBe(false);
    });

    it('should fail auth with no config', async () => {
      const result = await geminiAdapter.authenticate({});
      expect(result).toBe(false);
    });

    it('should throw error if sending without auth', async () => {
      const payload = {
        sessionId: 'test-session',
        messages: [{ role: 'user' as const, content: 'Hello' }],
        contextEvents: []
      };

      await expect(geminiAdapter.sendMessage(payload)).rejects.toThrow('Not authenticated');
    });
  });

  describe('Claude Adapter', () => {
    it('should have correct metadata', () => {
      expect(claudeAdapter.id).toBe('claude');
      expect(claudeAdapter.displayName).toBe('Anthropic Claude');
      expect(claudeAdapter.supports.vision).toBe(true);
      expect(claudeAdapter.supports.maxContextBytes).toBe(200000);
    });

    it('should fail auth without token', async () => {
      const result = await claudeAdapter.authenticate({ token: '' });
      expect(result).toBe(false);
    });

    it('should throw error if sending without auth', async () => {
      const payload = {
        sessionId: 'test-session',
        messages: [{ role: 'user' as const, content: 'Hello' }],
        contextEvents: []
      };

      await expect(claudeAdapter.sendMessage(payload)).rejects.toThrow('Not authenticated');
    });
  });

  describe('ChatGPT Adapter', () => {
    it('should have correct metadata', () => {
      expect(chatgptAdapter.id).toBe('chatgpt');
      expect(chatgptAdapter.displayName).toBe('OpenAI ChatGPT');
      expect(chatgptAdapter.supports.vision).toBe(true);
      expect(chatgptAdapter.supports.maxContextBytes).toBe(128000);
    });

    it('should fail auth without token', async () => {
      const result = await chatgptAdapter.authenticate({ token: '' });
      expect(result).toBe(false);
    });

    it('should throw error if sending without auth', async () => {
      const payload = {
        sessionId: 'test-session',
        messages: [{ role: 'user' as const, content: 'Hello' }],
        contextEvents: []
      };

      await expect(chatgptAdapter.sendMessage(payload)).rejects.toThrow('Not authenticated');
    });
  });
});
