import type { ProviderAdapter, ProviderId, ProviderAuthConfig } from './types';
import { geminiAdapter } from '../../extension/providers/gemini/adapter';
import { claudeAdapter } from '../../extension/providers/claude/adapter';
import { chatgptAdapter } from '../../extension/providers/chatgpt/adapter';
import { createCustomProviderAdapter, type CustomProviderDefinition } from './custom-provider';

class ProviderRegistry {
  private adapters: Map<ProviderId, ProviderAdapter> = new Map();
  private authConfigs: Map<ProviderId, ProviderAuthConfig> = new Map();
  private customProviders: Map<string, CustomProviderDefinition> = new Map();

  constructor() {
    // Register built-in providers
    this.register(geminiAdapter);
    this.register(claudeAdapter);
    this.register(chatgptAdapter);
  }

  /**
   * Register a provider adapter (built-in or custom)
   */
  register(adapter: ProviderAdapter): void {
    this.adapters.set(adapter.id, adapter);
    console.log(`[ProviderRegistry] Registered provider: ${adapter.id} (${adapter.displayName})`);
  }

  /**
   * Unregister a provider (primarily for custom providers)
   */
  unregister(id: ProviderId): boolean {
    const removed = this.adapters.delete(id);
    if (removed) {
      console.log(`[ProviderRegistry] Unregistered provider: ${id}`);
      this.authConfigs.delete(id);
      // If custom provider, also remove from storage
      if (id.startsWith('custom:')) {
        const customId = id.substring(7);
        this.customProviders.delete(customId);
      }
    }
    return removed;
  }

  /**
   * Add a custom provider dynamically
   */
  addCustomProvider(definition: CustomProviderDefinition): ProviderId {
    const adapter = createCustomProviderAdapter(definition);
    this.register(adapter);
    this.customProviders.set(definition.id, definition);
    console.log(`[ProviderRegistry] Added custom provider: ${definition.id}`);
    return adapter.id;
  }

  /**
   * Get all registered providers
   */
  listAll(): ProviderAdapter[] {
    return Array.from(this.adapters.values());
  }

  /**
   * Get only built-in providers
   */
  listBuiltin(): ProviderAdapter[] {
    return Array.from(this.adapters.values()).filter(
      (adapter) => !adapter.id.startsWith('custom:')
    );
  }

  /**
   * Get only custom providers
   */
  listCustom(): ProviderAdapter[] {
    return Array.from(this.adapters.values()).filter(
      (adapter) => adapter.id.startsWith('custom:')
    );
  }

  /**
   * Get custom provider definitions
   */
  getCustomDefinitions(): CustomProviderDefinition[] {
    return Array.from(this.customProviders.values());
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
