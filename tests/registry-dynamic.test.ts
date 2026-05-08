import { describe, it, expect, beforeEach } from 'vitest';
import { providerRegistry } from '@ai/shared/provider-contract/registry';
import { createCustomProviderAdapter, validateCustomProviderDefinition } from '@ai/shared/provider-contract/custom-provider';
import type { ProviderAdapter, ProviderId, ProviderAuthConfig } from '@ai/shared/provider-contract/types';

describe('ProviderRegistry (dynamic/custom flows)', () => {
	const customDef = {
		id: 'dyn-test',
		displayName: 'Dynamic Test Provider',
		endpoint: 'https://example.com',
		authType: 'none',
		modelList: ['dyn-model'],
		capabilities: { vision: false, tools: false, maxContextBytes: 12345 },
		headers: { 'X-Test': '1' }
	};

	afterEach(() => {
		// Clean up custom providers after each test
		providerRegistry.unregister('custom:dyn-test');
		providerRegistry.unregister('custom:dyn-test2');
	});

	it('addCustomProvider registers and lists custom provider', () => {
		const id = providerRegistry.addCustomProvider(customDef);
		expect(id).toBe('custom:dyn-test');
		const found = providerRegistry.get(id);
		expect(found).toBeDefined();
		expect(found?.displayName).toBe('Dynamic Test Provider');
		expect(providerRegistry.listCustom().map(p => p.id)).toContain(id);
		expect(providerRegistry.listAll().map(p => p.id)).toContain(id);
		expect(providerRegistry.getCustomDefinitions().find(d => d.id === 'dyn-test')).toBeDefined();
	});

	it('unregister removes provider and cleans up custom definition', () => {
		const id = providerRegistry.addCustomProvider(customDef);
		expect(providerRegistry.has(id)).toBe(true);
		const removed = providerRegistry.unregister(id);
		expect(removed).toBe(true);
		expect(providerRegistry.has(id)).toBe(false);
		expect(providerRegistry.getCustomDefinitions().find(d => d.id === 'dyn-test')).toBeUndefined();
	});

	it('unregister returns false for unknown id', () => {
		expect(providerRegistry.unregister('custom:does-not-exist')).toBe(false);
	});

	it('listBuiltin does not include custom providers', () => {
		providerRegistry.addCustomProvider(customDef);
		const builtins = providerRegistry.listBuiltin();
		expect(builtins.find(p => p.id.startsWith('custom:'))).toBeUndefined();
		expect(builtins.find(p => p.id === 'gemini')).toBeDefined();
	});

	it('listCustom only includes custom providers', () => {
		providerRegistry.addCustomProvider(customDef);
		providerRegistry.addCustomProvider({ ...customDef, id: 'dyn-test2', displayName: 'Another' });
		const customs = providerRegistry.listCustom();
		expect(customs.length).toBeGreaterThanOrEqual(2);
		expect(customs.every(p => p.id.startsWith('custom:'))).toBe(true);
	});

	it('getCustomDefinitions returns all custom definitions', () => {
		providerRegistry.addCustomProvider(customDef);
		providerRegistry.addCustomProvider({ ...customDef, id: 'dyn-test2', displayName: 'Another' });
		const defs = providerRegistry.getCustomDefinitions();
		expect(defs.find(d => d.id === 'dyn-test')).toBeDefined();
		expect(defs.find(d => d.id === 'dyn-test2')).toBeDefined();
	});

	it('validateCustomProviderDefinition enforces rules', () => {
		expect(validateCustomProviderDefinition({ ...customDef, id: 'bad id' })).toMatch(/Provider ID/);
		expect(validateCustomProviderDefinition({ ...customDef, displayName: '' })).toMatch(/Display name/);
		expect(validateCustomProviderDefinition({ ...customDef, endpoint: 'ftp://bad' })).toMatch(/Endpoint/);
		expect(validateCustomProviderDefinition({ ...customDef, authType: 'invalid' as any })).toMatch(/Auth type/);
		expect(validateCustomProviderDefinition({ ...customDef, modelList: [] })).toMatch(/At least one model/);
		expect(validateCustomProviderDefinition(customDef)).toBeNull();
	});

	it('register and get works for direct custom adapter', () => {
		const adapter: ProviderAdapter = createCustomProviderAdapter(customDef);
		providerRegistry.register(adapter);
		expect(providerRegistry.get(adapter.id)).toBeDefined();
		providerRegistry.unregister(adapter.id);
	});

	it('setAuth/getAuth works for custom provider', () => {
		const id = providerRegistry.addCustomProvider(customDef);
		const config: ProviderAuthConfig = { token: 'abc', endpoint: 'https://example.com' };
		providerRegistry.setAuth(id, config);
		expect(providerRegistry.getAuth(id)).toEqual(config);
	});

	it('authenticate returns false if no config', async () => {
		const id = providerRegistry.addCustomProvider(customDef);
		expect(await providerRegistry.authenticate(id)).toBe(false);
	});

	it('authenticate returns false for unknown provider', async () => {
		expect(await providerRegistry.authenticate('custom:does-not-exist')).toBe(false);
	});

	it('authenticate calls adapter.authenticate if config present', async () => {
		const id = providerRegistry.addCustomProvider(customDef);
		// Patch the adapter to always return true
		const adapter = providerRegistry.get(id)!;
		adapter.authenticate = async () => true;
		providerRegistry.setAuth(id, { token: 't' });
		expect(await providerRegistry.authenticate(id)).toBe(true);
	});
});

