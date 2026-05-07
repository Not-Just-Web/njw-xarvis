/**
 * Configuration for Connector API endpoints
 * Extension will use these URLs to communicate with the backend
 * 
 * Deployment Architecture:
 * - Extension: Builds locally and loads into browser
 * - Landing Page: https://njw-xarvis.vercel.app/ (root)
 * - Connector API: https://njw-xarvis.vercel.app/api/* (relative path)
 * 
 * Development: Uses http://localhost:3001 (local connector API)
 * Production: Uses /api (relative path on same Vercel domain)
 */

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface ProcessEnv {
      VITE_CONNECTOR_API_URL?: string;
      VITE_TARGET?: string;
    }
  }
}

export const CONNECTOR_API_CONFIG = {
  // Default behavior:
  // - Local development: http://localhost:3001 (set via VITE_CONNECTOR_API_URL)
  // - Build/production: https://njw-xarvis.vercel.app/api
  baseUrl: process.env.VITE_CONNECTOR_API_URL || 'https://njw-xarvis.vercel.app/api',

  // API endpoints
  endpoints: {
    health: '/health',
    auth: {
      token: '/auth/token',
      validate: '/auth/validate',
      refresh: '/auth/refresh',
      revoke: '/auth/revoke'
    },
    provider: {
      message: '/provider/message',
      health: '/provider/health'
    }
  },

  /**
   * Get full URL for an endpoint
   */
  getUrl(path: string): string {
    return `${this.baseUrl}${path}`;
  },

  /**
   * Check if using local development
   */
  isDevelopment(): boolean {
    return this.baseUrl.includes('localhost');
  },

  /**
   * Get full API URL (handles relative paths on Vercel)
   */
  getFullUrl(path: string): string {
    return this.getUrl(path);
  },

  /**
   * Get auth token endpoint
   */
  getAuthTokenUrl(): string {
    return this.getFullUrl(this.endpoints.auth.token);
  },

  /**
   * Get provider message endpoint
   */
  getProviderMessageUrl(): string {
    return this.getFullUrl(this.endpoints.provider.message);
  }
};

export default CONNECTOR_API_CONFIG;
