/**
 * Configuration for Connector API endpoints
 * Extension will use these URLs to communicate with the backend
 * 
 * Environment Variables:
 * - VITE_CONNECTOR_API_URL: Backend connector API URL (default: http://localhost:3001)
 *   Set during build time:
 *   - Dev: VITE_CONNECTOR_API_URL=http://localhost:3001 npm run dev
 *   - Prod: VITE_CONNECTOR_API_URL=https://your-vercel-domain.vercel.app npm run build
 */

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      VITE_CONNECTOR_API_URL?: string;
      VITE_TARGET?: string;
    }
  }
}

export const CONNECTOR_API_CONFIG = {
  // Vercel hosted API (configured at build time)
  // Falls back to localhost:3001 for local development
  baseUrl: process.env.VITE_CONNECTOR_API_URL || 'http://localhost:3001',

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
   * Get auth token endpoint
   */
  getAuthTokenUrl(): string {
    return this.getUrl(this.endpoints.auth.token);
  },

  /**
   * Get provider message endpoint
   */
  getProviderMessageUrl(): string {
    return this.getUrl(this.endpoints.provider.message);
  }
};

export default CONNECTOR_API_CONFIG;
