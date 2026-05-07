/**
 * Authentication Handler
 * Manages provider authentication, token storage, and connector API communication
 * Runs in background script for secure credential handling
 */

import CONNECTOR_API_CONFIG from '../../shared/connector-api/config';

interface StoredAuth {
  token: string;
  expiresAt: number;
  providerId: string;
}

// In-memory storage for tokens (replace with Chrome storage in production)
const tokenStore = new Map<string, StoredAuth>();

/**
 * Exchange credentials for JWT token via connector API
 */
export const exchangeCredentialsForToken = async (
  providerId: string,
  credentials: { apiKey: string }
): Promise<string> => {
  const extensionId = chrome.runtime.id;

  const response = await fetch(
    CONNECTOR_API_CONFIG.getFullUrl(CONNECTOR_API_CONFIG.endpoints.auth.token),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        extensionId,
        providerId,
        credentials
      })
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `Token exchange failed: ${response.statusText}`
    );
  }

  const data = await response.json();

  if (!data.token) {
    throw new Error('No token received from connector API');
  }

  // Calculate expiration time (assuming 24h tokens)
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

  // Store token in memory
  tokenStore.set(providerId, {
    token: data.token,
    expiresAt,
    providerId
  });

  // Also store in Chrome storage for persistence across restarts
  await chrome.storage.local.set({
    [`auth_${providerId}`]: {
      token: data.token,
      expiresAt
    }
  });

  return data.token;
};

/**
 * Get stored token for provider
 */
export const getStoredToken = async (providerId: string): Promise<string | null> => {
  // Check memory first
  const stored = tokenStore.get(providerId);

  if (stored) {
    // Check if expired
    if (Date.now() < stored.expiresAt) {
      return stored.token;
    }
    // Token expired, remove it
    tokenStore.delete(providerId);
  }

  // Try to restore from Chrome storage
  const data = await chrome.storage.local.get(`auth_${providerId}`);
  const storedData = data[`auth_${providerId}`];

  if (storedData && Date.now() < storedData.expiresAt) {
    tokenStore.set(providerId, {
      token: storedData.token,
      expiresAt: storedData.expiresAt,
      providerId
    });
    return storedData.token;
  }

  return null;
};

/**
 * Refresh expired token
 */
export const refreshToken = async (providerId: string): Promise<string> => {
  const token = await getStoredToken(providerId);

  if (!token) {
    throw new Error(`No token found for ${providerId}`);
  }

  const response = await fetch(
    CONNECTOR_API_CONFIG.getFullUrl(CONNECTOR_API_CONFIG.endpoints.auth.refresh),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        providerId
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.token) {
    throw new Error('No new token received from refresh');
  }

  // Update stored token
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
  tokenStore.set(providerId, {
    token: data.token,
    expiresAt,
    providerId
  });

  await chrome.storage.local.set({
    [`auth_${providerId}`]: {
      token: data.token,
      expiresAt
    }
  });

  return data.token;
};

/**
 * Revoke token (logout)
 */
export const revokeToken = async (providerId: string): Promise<void> => {
  const token = await getStoredToken(providerId);

  if (token) {
    try {
      await fetch(
        CONNECTOR_API_CONFIG.getFullUrl(CONNECTOR_API_CONFIG.endpoints.auth.revoke),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            providerId
          })
        }
      );
    } catch (error) {
      console.error(`Failed to revoke token for ${providerId}:`, error);
    }
  }

  // Clear from memory and storage
  tokenStore.delete(providerId);
  await chrome.storage.local.remove(`auth_${providerId}`);
};

/**
 * Check if provider is authenticated
 */
export const isProviderAuthenticated = async (providerId: string): Promise<boolean> => {
  const token = await getStoredToken(providerId);
  return token !== null;
};

/**
 * Get authentication status for all providers
 */
export const getAuthenticationStatus = async (
  providerIds: string[]
): Promise<Record<string, boolean>> => {
  const status: Record<string, boolean> = {};

  for (const providerId of providerIds) {
    status[providerId] = await isProviderAuthenticated(providerId);
  }

  return status;
};

/**
 * Listen for chrome storage changes and update token store
 */
export const initializeAuthListener = (): void => {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local') {
      for (const key in changes) {
        if (key.startsWith('auth_')) {
          const providerId = key.replace('auth_', '');
          const change = changes[key];

          if (change.newValue) {
            tokenStore.set(providerId, {
              token: change.newValue.token,
              expiresAt: change.newValue.expiresAt,
              providerId
            });
          } else {
            tokenStore.delete(providerId);
          }
        }
      }
    }
  });
};
