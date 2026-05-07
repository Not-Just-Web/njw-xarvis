/**
 * Provider Setup Form Component
 * Allows users to enter API credentials for their selected provider
 * Handles token exchange with connector API
 */

import React, { useState } from 'react';
import CONNECTOR_API_CONFIG from '@ai/shared/connector-api/config';

interface ProviderSetupProps {
  providerId: 'gemini' | 'claude' | 'chatgpt';
  displayName: string;
  onTokenReceived: (token: string) => void;
  onError: (error: string) => void;
  isLoading?: boolean;
}

export const ProviderSetup: React.FC<ProviderSetupProps> = ({
  providerId,
  displayName,
  onTokenReceived,
  onError,
  isLoading = false
}) => {
  const [apiKey, setApiKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!apiKey.trim()) {
      onError('API key cannot be empty');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get extension ID
      const extensionId = chrome.runtime.id;

      // Call connector API to exchange credentials for JWT token
      const response = await fetch(
        CONNECTOR_API_CONFIG.getFullUrl(CONNECTOR_API_CONFIG.endpoints.auth.token),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            extensionId,
            providerId,
            credentials: { apiKey: apiKey.trim() }
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Failed to authenticate: ${response.statusText}`
        );
      }

      const data = await response.json();

      if (!data.token) {
        throw new Error('No token received from server');
      }

      // Clear the form
      setApiKey('');

      // Notify parent component
      onTokenReceived(data.token);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[ProviderSetup] Error for ${providerId}:`, errorMessage);
      onError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="provider-setup">
      <h3>{displayName} Setup</h3>

      <form onSubmit={handleSubmit} className="provider-form">
        <div className="form-group">
          <label htmlFor={`${providerId}-key`}>API Key</label>
          <div className="input-wrapper">
            <input
              id={`${providerId}-key`}
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={`Enter your ${displayName} API key`}
              disabled={isSubmitting || isLoading}
              className="api-key-input"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="toggle-visibility"
              title={showApiKey ? 'Hide' : 'Show'}
            >
              {showApiKey ? '👁️‍🗨️' : '👁️'}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || isLoading || !apiKey.trim()}
          className="submit-button"
        >
          {isSubmitting || isLoading ? 'Authenticating...' : 'Connect'}
        </button>
      </form>

      <p className="security-note">
        ✓ Your API key is sent securely to our backend and never stored in your browser.
      </p>
    </div>
  );
};

export default ProviderSetup;
