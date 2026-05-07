import { describe, it, expect, vi, beforeEach } from 'vitest';
import { routeRuntimeMessage } from '@ai/extension/background/router';
import type { RuntimeMessage } from '@ai/shared/types/runtime-messages';

describe('background router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('routeRuntimeMessage', () => {
    it('handles provider.setActive message', async () => {
      const message: RuntimeMessage = {
        type: 'provider.setActive',
        payload: { providerId: 'claude' }
      };

      const response = await routeRuntimeMessage(message);
      expect(response.type).toBe('response');
      expect(response.payload.ok).toBe(true);
      expect(response.payload.providerId).toBe('claude');
    });

    it('handles provider.getActive message', async () => {
      const message: RuntimeMessage = {
        type: 'provider.getActive',
        payload: {}
      };

      const response = await routeRuntimeMessage(message);
      expect(response.type).toBe('response');
      expect(response.payload.ok).toBe(true);
      expect(response.payload.providerId).toBeDefined();
    });

    it('handles chat.healthCheck message', async () => {
      const message: RuntimeMessage = {
        type: 'chat.healthCheck',
        payload: { ping: true }
      };

      const response = await routeRuntimeMessage(message);
      expect(response.type).toBe('response');
      expect(response.payload.ok).toBe(true);
      expect(response.payload.status).toBe('healthy');
    });

    it('returns error response for unknown message type', async () => {
      const message = { type: 'unknown.message', payload: {} } as unknown as RuntimeMessage;

      const response = await routeRuntimeMessage(message);
      expect(response.type).toBe('response');
      expect(response.payload.ok).toBe(false);
      expect(response.payload.error).toContain('Unsupported');
    });
  });
});
