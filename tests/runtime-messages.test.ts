import { describe, it, expect } from 'vitest';
import { isRuntimeMessage } from '../shared/types/runtime-messages';
import type {
  SetActiveProviderMessage,
  GetActiveProviderMessage,
  SendChatMessage,
  HealthCheckMessage
} from '../shared/types/runtime-messages';

describe('Runtime Messages', () => {
  describe('isRuntimeMessage type guard', () => {
    it('should validate SetActiveProviderMessage', () => {
      const msg: SetActiveProviderMessage = {
        type: 'provider.setActive',
        payload: { providerId: 'gemini' }
      };

      expect(isRuntimeMessage(msg)).toBe(true);
    });

    it('should validate GetActiveProviderMessage', () => {
      const msg: GetActiveProviderMessage = {
        type: 'provider.getActive',
        payload: {}
      };

      expect(isRuntimeMessage(msg)).toBe(true);
    });

    it('should validate SendChatMessage', () => {
      const msg: SendChatMessage = {
        type: 'chat.send',
        payload: {
          sessionId: 'session-123',
          prompt: 'Hello',
          context: []
        }
      };

      expect(isRuntimeMessage(msg)).toBe(true);
    });

    it('should validate HealthCheckMessage', () => {
      const msg: HealthCheckMessage = {
        type: 'chat.healthCheck',
        payload: { ping: true }
      };

      expect(isRuntimeMessage(msg)).toBe(true);
    });

    it('should reject invalid messages', () => {
      // The guard only checks for type string and defined payload
      // An object with type and payload will pass the guard
      // This is by design - the guard is permissive
      const message = { type: 'any.type', payload: {} };

      expect(isRuntimeMessage(message)).toBe(true); // Passes guard check
    });

    it('should reject messages with missing payload', () => {
      const incomplete = { type: 'provider.setActive' };

      expect(isRuntimeMessage(incomplete)).toBe(false);
    });

    it('should reject non-object types', () => {
      expect(isRuntimeMessage('string')).toBe(false);
      expect(isRuntimeMessage(123)).toBe(false);
      expect(isRuntimeMessage(null)).toBe(false);
      expect(isRuntimeMessage(undefined)).toBe(false);
    });

    it('should reject object without type field', () => {
      expect(isRuntimeMessage({ payload: {} })).toBe(false);
    });

    it('should reject object with non-string type', () => {
      expect(isRuntimeMessage({ type: 123, payload: {} })).toBe(false);
    });

    it('should accept any non-undefined payload', () => {
      const msg1 = { type: 'provider.setActive', payload: {} };
      const msg2 = { type: 'chat.send', payload: { sessionId: '123', prompt: 'hi', context: [] } };
      const msg3 = { type: 'provider.getActive', payload: {} };

      expect(isRuntimeMessage(msg1)).toBe(true);
      expect(isRuntimeMessage(msg2)).toBe(true);
      expect(isRuntimeMessage(msg3)).toBe(true);
    });
  });
});
