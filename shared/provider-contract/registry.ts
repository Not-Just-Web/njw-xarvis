import type { ProviderAdapter, ProviderId, ProviderAuthConfig } from './types';
import { geminiAdapter } from '../../extension/providers/gemini/adapter';
import { claudeAdapter } from '../../extension/providers/claude/adapter';
import { chatgptAdapter } from '../../extension/providers/chatgpt/adapter';

class ProviderRegistry {
  private adapters: Map<ProviderId, ProviderAdapter> = new Map();
  private authConfigs: Map<ProviderId, ProviderAuthConfig> = new Map();

  constructor() {
    // Register built-in providers
    this.register(geminiAdapter);
    this.register(claudeAdapter);
    this.register(chatgptAdapter);
  }

  /**
   * Register a provider adapter
   */
  register(adapter: ProviderAdapter): void {
    this.adapters.set(adapter.id, adapter);
    console.log(`[ProviderRegistry] Registered provider: ${adapter.id} (${adapter.displayName})`);
  }

  /**
   * Get all registered providers
   */
  listAll(): ProviderAdapter[] {
    return Array.from(this.adapters.values());
  }

  /**
   * Get a specific provider by ID
   */
  get(id: ProviderId): ProviderAdapter | undefined {
    return this.adapters.get(id);
  }

  /**
   * Check if a provider is registered
   */
  has(id: ProviderId): boolean {
    return this.adapters.has(id);
  }

  /**
   * Set authentication config for a provider
   */
  setAuth(providerId: ProviderId, config: ProviderAuthConfig): void {
    this.authConfigs.set(providerId, config);
  }

  /**
   * Get authentication config for a provider
   */
  getAuth(providerId: ProviderId): ProviderAuthConfig | undefined {
    return this.authConfigs.get(providerId);
  }

  /**
   * Authenticate a provider with stored config
   */
  async authenticate(providerId: ProviderId): Promise<boolean> {
    const adapter = this.adapters.get(providerId);
    if (!adapter) {
      console.error(`[ProviderRegistry] Provider not found: ${providerId}`);
      return false;
    }

    const config = this.authConfigs.get(providerId);
    if (!config) {
      console.error(`[ProviderRegistry] No auth config for provider: ${providerId}`);
      return false;
    }

    try {
      const success = await adapter.authenticate(config);
      if (success) {
        console.log(`[ProviderRegistry] Authentication successful for ${providerId}`);
      } else {
        console.warn(`[ProviderRegistry] Authentication failed for ${providerId}`);
      }
      return success;
    } catch (error) {
      console.error(`[ProviderRegistry] Authentication error for ${providerId}:`, error);
      return false;
    }
  }
}

// Singleton instance
export const providerRegistry = new ProviderRegistry();
