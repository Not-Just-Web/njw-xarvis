import { describe, it, expect, vi, afterEach } from 'vitest';
import { captureCurrentUrl, captureSelectedText } from '@ai/extension/content-script/selection';

describe('content-script selection', () => {
  describe('captureCurrentUrl', () => {
    it('returns a CapturedContext with type url', () => {
      Object.defineProperty(window, 'location', {
        value: { href: 'https://example.com/page' },
        writable: true
      });

      const result = captureCurrentUrl();
      expect(result.type).toBe('url');
      expect(result.label).toBe('Page URL');
      expect(result.payload).toBe('https://example.com/page');
    });
  });

  describe('captureSelectedText', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('returns null when no text is selected', () => {
      const mockSelection = { toString: () => '' } as Selection;
      vi.spyOn(window, 'getSelection').mockReturnValue(mockSelection);

      const result = captureSelectedText();
      expect(result).toBeNull();
    });

    it('returns null when selection only has whitespace', () => {
      const mockSelection = { toString: () => '   ' } as Selection;
      vi.spyOn(window, 'getSelection').mockReturnValue(mockSelection);

      const result = captureSelectedText();
      expect(result).toBeNull();
    });

    it('returns CapturedContext when text is selected', () => {
      const mockSelection = { toString: () => 'Selected text content' } as Selection;
      vi.spyOn(window, 'getSelection').mockReturnValue(mockSelection);

      const result = captureSelectedText();
      expect(result).not.toBeNull();
      expect(result!.type).toBe('selection');
      expect(result!.label).toBe('Selected Text');
      expect(result!.payload).toBe('Selected text content');
    });

    it('trims whitespace from selected text', () => {
      const mockSelection = { toString: () => '  trimmed  ' } as Selection;
      vi.spyOn(window, 'getSelection').mockReturnValue(mockSelection);

      const result = captureSelectedText();
      expect(result!.payload).toBe('trimmed');
    });

    it('returns null when getSelection returns null', () => {
      vi.spyOn(window, 'getSelection').mockReturnValue(null);

      const result = captureSelectedText();
      expect(result).toBeNull();
    });
  });
});
