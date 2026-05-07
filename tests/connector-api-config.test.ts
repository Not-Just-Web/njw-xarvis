import { describe, it, expect } from 'vitest';
import CONNECTOR_API_CONFIG from '@ai/shared/connector-api/config';

describe('connector-api config', () => {
  describe('baseUrl', () => {
    it('defaults to /api when no env variable set', () => {
      expect(CONNECTOR_API_CONFIG.baseUrl).toBe('/api');
    });
  });

  describe('endpoints', () => {
    it('has auth endpoints defined', () => {
      expect(CONNECTOR_API_CONFIG.endpoints.auth.token).toBe('/auth/token');
      expect(CONNECTOR_API_CONFIG.endpoints.auth.validate).toBe('/auth/validate');
      expect(CONNECTOR_API_CONFIG.endpoints.auth.refresh).toBe('/auth/refresh');
      expect(CONNECTOR_API_CONFIG.endpoints.auth.revoke).toBe('/auth/revoke');
    });

    it('has provider endpoints defined', () => {
      expect(CONNECTOR_API_CONFIG.endpoints.provider.message).toBe('/provider/message');
      expect(CONNECTOR_API_CONFIG.endpoints.provider.health).toBe('/provider/health');
    });

    it('has health endpoint defined', () => {
      expect(CONNECTOR_API_CONFIG.endpoints.health).toBe('/health');
    });
  });

  describe('getUrl', () => {
    it('concatenates baseUrl and path', () => {
      const url = CONNECTOR_API_CONFIG.getUrl('/auth/token');
      expect(url).toBe('/api/auth/token');
    });
  });

  describe('isDevelopment', () => {
    it('returns false when using relative /api path', () => {
      expect(CONNECTOR_API_CONFIG.isDevelopment()).toBe(false);
    });
  });

  describe('getAuthTokenUrl', () => {
    it('returns a string URL', () => {
      const url = CONNECTOR_API_CONFIG.getAuthTokenUrl();
      expect(typeof url).toBe('string');
      expect(url).toContain('/auth/token');
    });
  });

  describe('getProviderMessageUrl', () => {
    it('returns a string URL', () => {
      const url = CONNECTOR_API_CONFIG.getProviderMessageUrl();
      expect(typeof url).toBe('string');
      expect(url).toContain('/provider/message');
    });
  });
});
