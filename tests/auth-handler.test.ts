import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  exchangeCredentialsForToken,
  getStoredToken,
  revokeToken,
  isProviderAuthenticated,
  getAuthenticationStatus,
  initializeAuthListener,
  clearAllTokens
} from '@ai/extension/background/auth-handler';

const mockFetchResponse = (body: unknown, ok = true) =>
  vi.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 400,
    statusText: ok ? 'OK' : 'Bad Request',
    json: vi.fn().mockResolvedValue(body)
  });

describe('auth-handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAllTokens();
    (chrome.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('exchangeCredentialsForToken', () => {
    it('fetches a token from the connector API', async () => {
      global.fetch = mockFetchResponse({ token: 'jwt-abc-123' });

      const token = await exchangeCredentialsForToken('gemini', { apiKey: 'my-key' });

      expect(token).toBe('jwt-abc-123');
      expect(global.fetch).toHaveBeenCalledOnce();
    });

    it('throws when API responds with an error', async () => {
      global.fetch = mockFetchResponse({ message: 'Invalid key' }, false);

      await expect(
        exchangeCredentialsForToken('gemini', { apiKey: 'bad-key' })
      ).rejects.toThrow('Invalid key');
    });

    it('throws when no token in response', async () => {
      global.fetch = mockFetchResponse({ ok: true });

      await expect(
        exchangeCredentialsForToken('gemini', { apiKey: 'my-key' })
      ).rejects.toThrow('No token received');
    });
  });

  describe('getStoredToken', () => {
    it('returns null when no token is stored', async () => {
      (chrome.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({});
      const token = await getStoredToken('gemini');
      expect(token).toBeNull();
    });

    it('returns null when stored token is expired', async () => {
      (chrome.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        auth_gemini: { token: 'old-token', expiresAt: Date.now() - 1000 }
      });
      const token = await getStoredToken('gemini');
      expect(token).toBeNull();
    });

    it('returns token when valid and not expired', async () => {
      (chrome.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        auth_gemini: { token: 'valid-token', expiresAt: Date.now() + 100000 }
      });
      const token = await getStoredToken('gemini');
      expect(token).toBe('valid-token');
    });
  });

  describe('isProviderAuthenticated', () => {
    it('returns false when no token stored', async () => {
      (chrome.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({});
      expect(await isProviderAuthenticated('gemini')).toBe(false);
    });

    it('returns true when valid token stored', async () => {
      (chrome.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        auth_gemini: { token: 'valid', expiresAt: Date.now() + 100000 }
      });
      expect(await isProviderAuthenticated('gemini')).toBe(true);
    });
  });

  describe('getAuthenticationStatus', () => {
    it('returns status object for all requested providers', async () => {
      (chrome.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({});
      const status = await getAuthenticationStatus(['gemini', 'claude', 'chatgpt']);
      expect(status).toEqual({ gemini: false, claude: false, chatgpt: false });
    });
  });

  describe('revokeToken', () => {
    it('removes token from storage', async () => {
      (chrome.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        auth_gemini: { token: 'tok', expiresAt: Date.now() + 100000 }
      });
      global.fetch = mockFetchResponse({ revoked: true });

      await revokeToken('gemini');

      expect(chrome.storage.local.remove).toHaveBeenCalledWith('auth_gemini');
    });

    it('still removes local token even when API call fails', async () => {
      (chrome.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        auth_gemini: { token: 'tok', expiresAt: Date.now() + 100000 }
      });
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      await revokeToken('gemini');

      expect(chrome.storage.local.remove).toHaveBeenCalledWith('auth_gemini');
    });
  });

  describe('initializeAuthListener', () => {
    it('registers a storage change listener', () => {
      initializeAuthListener();
      expect(chrome.storage.onChanged.addListener).toHaveBeenCalledOnce();
    });
  });
});
