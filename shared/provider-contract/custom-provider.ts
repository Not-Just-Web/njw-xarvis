/**
 * Custom provider definition and management
 * Allows users to add their own AI provider without code changes
 */

import type { ProviderAdapter, ProviderCapability, ProviderSendPayload, ProviderSendResult } from './types';

export type CustomProviderDefinition = {
  id: string; // Will be prefixed with 'custom:' when registered
  displayName: string;
  endpoint: string;
  authType: 'none' | 'api-key' | 'bearer' | 'basic';
  modelList: string[];
  capabilities: ProviderCapability;
  headers?: Record<string, string>;
};

/**
 * Build a dynamic provider adapter from a custom definition
 */
export function createCustomProviderAdapter(definition: CustomProviderDefinition): ProviderAdapter {
  const id = `custom:${definition.id}` as const;

  return {
    id,
    displayName: definition.displayName,
    supports: definition.capabilities,
    
    authenticate: async function(config): Promise<boolean> {
      try {
        // Validate endpoint is reachable and credentials work
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          ...definition.headers,
        };

        if (config && config.token && definition.authType === 'api-key') {
          headers['X-API-Key'] = config.token;
        } else if (config && config.token && definition.authType === 'bearer') {
          headers['Authorization'] = `Bearer ${config.token}`;
        } else if (config && config.token && definition.authType === 'basic') {
          headers['Authorization'] = `Basic ${config.token}`;
        }

        const response = await fetch(`${definition.endpoint}/health`, {
          method: 'GET',
          headers,
        });

        return response.ok;
      } catch (error) {
        console.error(`[CustomProvider] Auth failed for ${definition.id}:`, error);
        return false;
      }
    },

    sendMessage: async (payload: ProviderSendPayload): Promise<ProviderSendResult> => {
      try {
        // const authConfig = {}; // Get from extension storage in real implementation
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          ...definition.headers,
        };

        // Build request body in standard format
        const requestBody = {
          model: definition.modelList[0], // Use first model by default
          messages: payload.messages,
          stream: false,
        };

        const response = await fetch(`${definition.endpoint}/chat/completions`, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error(`Provider returned ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Parse response - expects OpenAI-compatible format
        return {
          text: data.choices?.[0]?.message?.content || 'No response content',
          model: data.model || definition.modelList[0],
          tokensUsed: data.usage?.total_tokens,
        };
      } catch (error) {
        throw new Error(`Failed to send message to ${definition.id}: ${error instanceof Error ? error.message : String(error)}`);
      }
    },
  };
}

/**
 * Validate a custom provider definition
 */
export function validateCustomProviderDefinition(def: Partial<CustomProviderDefinition>): string | null {
  if (!def.id || typeof def.id !== 'string' || !/^[a-z0-9-]+$/.test(def.id)) {
    return 'Provider ID must contain only lowercase letters, numbers, and hyphens';
  }

  if (!def.displayName || typeof def.displayName !== 'string') {
    return 'Display name is required';
  }

  if (!def.endpoint || typeof def.endpoint !== 'string' || !def.endpoint.startsWith('http')) {
    return 'Endpoint must be a valid HTTP(S) URL';
  }

  if (!def.authType || !['none', 'api-key', 'bearer', 'basic'].includes(def.authType)) {
    return 'Auth type must be one of: none, api-key, bearer, basic';
  }

  if (!Array.isArray(def.modelList) || def.modelList.length === 0) {
    return 'At least one model must be specified';
  }

  if (!def.capabilities) {
    return 'Capabilities are required';
  }

  return null;
}
