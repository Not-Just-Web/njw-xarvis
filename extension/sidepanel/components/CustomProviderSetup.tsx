import React, { useState } from 'react';
import type { CustomProviderDefinition } from '../../shared/provider-contract/custom-provider';
import { validateCustomProviderDefinition } from '../../shared/provider-contract/custom-provider';
import './CustomProviderSetup.css';

interface CustomProviderSetupProps {
  onAddProvider: (definition: CustomProviderDefinition) => Promise<void>;
  onClose: () => void;
}

export function CustomProviderSetup({ onAddProvider, onClose }: CustomProviderSetupProps) {
  const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [definition, setDefinition] = useState<Partial<CustomProviderDefinition>>({
    authType: 'api-key',
    capabilities: {
      vision: false,
      tools: false,
      maxContextBytes: 4096,
    },
    modelList: ['default'],
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('capabilities.')) {
      const cap = name.substring(13);
      setDefinition(prev => ({
        ...prev,
        capabilities: {
          ...prev.capabilities!,
          [cap]: cap === 'maxContextBytes' ? parseInt(value) : value === 'true',
        },
      }));
    } else if (name === 'modelList') {
      setDefinition(prev => ({
        ...prev,
        modelList: value.split(',').map(m => m.trim()),
      }));
    } else {
      setDefinition(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateCustomProviderDefinition(definition);
    if (validationError) {
      setError(validationError);
      return;
    }

    setStep('confirm');
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onAddProvider(definition as CustomProviderDefinition);
      setStep('success');
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add provider');
      setStep('form');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="custom-provider-setup success">
        <div className="success-icon">✓</div>
        <h2>Provider Added Successfully</h2>
        <p>{definition.displayName} has been added to your providers</p>
      </div>
    );
  }

  if (step === 'confirm') {
    return (
      <div className="custom-provider-setup confirm">
        <h2>Review Custom Provider</h2>
        <div className="provider-summary">
          <p><strong>Name:</strong> {definition.displayName}</p>
          <p><strong>Endpoint:</strong> {definition.endpoint}</p>
          <p><strong>Auth Type:</strong> {definition.authType}</p>
          <p><strong>Models:</strong> {definition.modelList?.join(', ')}</p>
          <p><strong>Capabilities:</strong></p>
          <ul>
            <li>Vision: {definition.capabilities?.vision ? 'Yes' : 'No'}</li>
            <li>Tools: {definition.capabilities?.tools ? 'Yes' : 'No'}</li>
            <li>Max Context: {definition.capabilities?.maxContextBytes} bytes</li>
          </ul>
        </div>
        {error && <div className="error-message">{error}</div>}
        <div className="button-group">
          <button onClick={() => setStep('form')} disabled={loading}>
            Back
          </button>
          <button onClick={handleConfirm} disabled={loading} className="primary">
            {loading ? 'Adding...' : 'Add Provider'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="custom-provider-setup form">
      <h2>Add Custom Provider</h2>
      <p className="description">Configure a custom AI provider to use alongside built-in providers</p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="id">Provider ID *</label>
          <input
            id="id"
            name="id"
            type="text"
            placeholder="e.g., 'my-provider'"
            value={definition.id || ''}
            onChange={handleInputChange}
            pattern="^[a-z0-9-]+$"
            title="Only lowercase letters, numbers, and hyphens"
            required
          />
          <small>Lowercase letters, numbers, and hyphens only. Prefixed with 'custom:' when added</small>
        </div>

        <div className="form-group">
          <label htmlFor="displayName">Display Name *</label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            placeholder="e.g., 'My AI Provider'"
            value={definition.displayName || ''}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="endpoint">API Endpoint *</label>
          <input
            id="endpoint"
            name="endpoint"
            type="url"
            placeholder="https://api.example.com"
            value={definition.endpoint || ''}
            onChange={handleInputChange}
            required
          />
          <small>Must be a valid HTTP(S) URL. Will be called with /health and /chat/completions</small>
        </div>

        <div className="form-group">
          <label htmlFor="authType">Authentication Type *</label>
          <select
            id="authType"
            name="authType"
            value={definition.authType || 'api-key'}
            onChange={handleInputChange}
          >
            <option value="none">None</option>
            <option value="api-key">API Key (X-API-Key header)</option>
            <option value="bearer">Bearer Token</option>
            <option value="basic">Basic Auth</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="modelList">Model Names *</label>
          <textarea
            id="modelList"
            name="modelList"
            placeholder="model-a, model-b, model-c"
            value={definition.modelList?.join(', ') || ''}
            onChange={handleInputChange}
            required
          />
          <small>Comma-separated list. First model is used by default</small>
        </div>

        <fieldset className="capabilities">
          <legend>Capabilities</legend>
          
          <div className="checkbox-group">
            <input
              id="vision"
              name="capabilities.vision"
              type="checkbox"
              checked={definition.capabilities?.vision || false}
              onChange={handleInputChange}
            />
            <label htmlFor="vision">Supports vision / image input</label>
          </div>

          <div className="checkbox-group">
            <input
              id="tools"
              name="capabilities.tools"
              type="checkbox"
              checked={definition.capabilities?.tools || false}
              onChange={handleInputChange}
            />
            <label htmlFor="tools">Supports tool/function calling</label>
          </div>

          <div className="form-group">
            <label htmlFor="maxContextBytes">Max Context Size (bytes)</label>
            <input
              id="maxContextBytes"
              name="capabilities.maxContextBytes"
              type="number"
              min="1000"
              max="1000000"
              value={definition.capabilities?.maxContextBytes || 4096}
              onChange={handleInputChange}
            />
          </div>
        </fieldset>

        {error && <div className="error-message">{error}</div>}

        <div className="button-group">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary">
            Next: Review
          </button>
        </div>
      </form>
    </div>
  );
}
