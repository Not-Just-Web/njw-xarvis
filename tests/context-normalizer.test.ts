import { describe, it, expect } from 'vitest';
import { normalizeToContextEvent, sanitizePayload } from '../extension/background/context-normalizer';
import type { CapturedContext } from '../extension/content-script/selection';

describe('Context Normalizer', () => {
  describe('normalizeToContextEvent', () => {
    it('should convert captured context to context event', () => {
      const captured: CapturedContext = {
        type: 'url',
        label: 'Page URL',
        payload: 'https://example.com'
      };

      const event = normalizeToContextEvent(captured, 'session-123');

      expect(event.id).toBeDefined();
      expect(event.sessionId).toBe('session-123');
      expect(event.type).toBe('url');
      expect(event.label).toBe('Page URL');
      expect(event.payload).toBe('https://example.com');
      expect(event.createdAt).toBeDefined();
    });

    it('should convert selection capture to context event', () => {
      const captured: CapturedContext = {
        type: 'selection',
        label: 'Selected Text',
        payload: 'selected text'
      };

      const event = normalizeToContextEvent(captured, 'session-123');

      expect(event.type).toBe('selection');
      expect(event.payload).toBe('selected text');
    });

    it('should convert element capture to context event', () => {
      const captured: CapturedContext = {
        type: 'element',
        label: 'Element',
        payload: 'button.primary'
      };

      const event = normalizeToContextEvent(captured, 'session-123');

      expect(event.type).toBe('element');
      expect(event.payload).toBe('button.primary');
    });

    it('should convert screenshot capture to context event', () => {
      const dataUrl = 'data:image/png;base64,abc123';
      const captured: CapturedContext = {
        type: 'screenshot',
        label: 'Screenshot',
        payload: dataUrl
      };

      const event = normalizeToContextEvent(captured, 'session-123');

      expect(event.type).toBe('screenshot');
      expect(event.payload).toBe(dataUrl);
    });

    it('should generate unique IDs for events', () => {
      const captured: CapturedContext = {
        type: 'url',
        label: 'URL',
        payload: 'https://example.com'
      };

      const event1 = normalizeToContextEvent(captured, 'session-1');
      const event2 = normalizeToContextEvent(captured, 'session-1');

      expect(event1.id).not.toBe(event2.id);
    });

    it('should set ISO string timestamp', () => {
      const captured: CapturedContext = {
        type: 'url',
        label: 'URL',
        payload: 'https://example.com'
      };

      const event = normalizeToContextEvent(captured, 'session-123');

      // ISO string format check
      expect(event.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should handle all context types', () => {
      const types: Array<CapturedContext['type']> = ['url', 'selection', 'element', 'screenshot', 'image'];

      types.forEach((type) => {
        const captured: CapturedContext = {
          type,
          label: `Label for ${type}`,
          payload: `payload-${type}`
        };

        const event = normalizeToContextEvent(captured, 'session-123');

        expect(event.type).toBe(type);
      });
    });
  });

  describe('sanitizePayload', () => {
    it('should return small payloads unchanged', () => {
      const small = 'small payload';
      const result = sanitizePayload(small);

      expect(result).toBe(small);
    });

    it('should truncate large payloads', () => {
      const large = 'x'.repeat(60000); // 60KB

      const result = sanitizePayload(large);

      expect(result.length).toBeLessThan(51000);
      expect(result).toContain('[truncated]');
    });

    it('should preserve content up to 50KB', () => {
      const exactSize = 'a'.repeat(49900);
      const result = sanitizePayload(exactSize);

      expect(result).toContain('a');
    });

    it('should add truncation marker exactly once', () => {
      const large = 'x'.repeat(60000);
      const result = sanitizePayload(large);

      const truncationCount = (result.match(/\[truncated\]/g) || []).length;

      expect(truncationCount).toBe(1);
    });

    it('should handle empty string', () => {
      const result = sanitizePayload('');

      expect(result).toBe('');
    });

    it('should work with edge case size (exactly 50KB)', () => {
      const exact50k = 'b'.repeat(50000);
      const result = sanitizePayload(exact50k);

      expect(result).toBe(exact50k);
    });

    it('should work with 50KB + 1 byte', () => {
      const over50k = 'c'.repeat(50001);
      const result = sanitizePayload(over50k);

      expect(result.length).toBeLessThan(51000);
      expect(result).toContain('[truncated]');
    });
  });
});
