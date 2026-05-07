import { useEffect, useMemo, useState } from 'react';
import type { ProviderId } from '../../shared/provider-contract/types';

const providers = [
  { id: 'gemini', label: 'Gemini' },
  { id: 'claude', label: 'Claude' },
  { id: 'chatgpt', label: 'ChatGPT' }
] as const;

type RuntimeResponse = {
  type: 'response';
  payload: {
    ok?: boolean;
    providerId?: ProviderId;
    connected?: boolean;
    error?: string;
  };
};

const sendRuntimeMessage = async (message: unknown): Promise<RuntimeResponse> => {
  return chrome.runtime.sendMessage(message) as Promise<RuntimeResponse>;
};

export function PopupApp(): JSX.Element {
  const [provider, setProvider] = useState<ProviderId>('gemini');
  const [status, setStatus] = useState('Checking connection...');
  const [connected, setConnected] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [busy, setBusy] = useState(false);

  const providerBadge = useMemo(() => provider.toUpperCase(), [provider]);

  const syncStatus = async (providerId: ProviderId) => {
    try {
      const activeRes = await sendRuntimeMessage({
        type: 'provider.setActive',
        payload: { providerId }
      });
      if (activeRes.payload.ok === false) {
        setStatus('Could not set provider');
        return;
      }

      const authRes = await sendRuntimeMessage({
        type: 'provider.getAuthStatus',
        payload: { providerId }
      });

      const isConnected = authRes.payload.ok === true && authRes.payload.connected === true;
      setConnected(isConnected);
      setStatus(isConnected ? 'Connected' : 'Not connected');
    } catch {
      setConnected(false);
      setStatus('Could not check connection');
    }
  };

  useEffect(() => {
    syncStatus(provider).catch(() => {
      setConnected(false);
      setStatus('Could not check connection');
    });
  }, [provider]);

  const connectProvider = async () => {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      setStatus('Enter API key to connect');
      return;
    }

    try {
      setBusy(true);
      setStatus('Connecting...');

      const res = await sendRuntimeMessage({
        type: 'provider.connect',
        payload: {
          providerId: provider,
          apiKey: trimmed
        }
      });

      if (res.payload.ok !== true || res.payload.connected !== true) {
        setConnected(false);
        setStatus(res.payload.error ?? 'Connection failed');
        return;
      }

      setConnected(true);
      setApiKey('');
      setStatus('Connected');
    } catch {
      setConnected(false);
      setStatus('Could not connect');
    } finally {
      setBusy(false);
    }
  };

  const disconnectProvider = async () => {
    try {
      setBusy(true);
      const res = await sendRuntimeMessage({
        type: 'provider.disconnect',
        payload: {
          providerId: provider
        }
      });
      if (res.payload.ok === true) {
        setConnected(false);
        setStatus('Disconnected');
      } else {
        setStatus(res.payload.error ?? 'Could not disconnect');
      }
    } catch {
      setStatus('Could not disconnect');
    } finally {
      setBusy(false);
    }
  };

  const openSidepanel = async () => {
    if (!connected) {
      setStatus('Connect provider first');
      return;
    }

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.windowId !== undefined && chrome.sidePanel?.open) {
        await chrome.sidePanel.open({ windowId: tab.windowId });
      }
      setStatus('Sidepanel opened');
    } catch {
      setStatus('Could not open sidepanel');
    }
  };

  return (
    <main className="popup-shell">
      <header>
        <p className="eyebrow">NJW Xarvis</p>
        <h1>Quick Launch</h1>
      </header>

      <section className="panel">
        <label htmlFor="provider">Provider</label>
        <select
          id="provider"
          value={provider}
          onChange={(event) => setProvider(event.target.value as ProviderId)}
          disabled={busy}
        >
          {providers.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>

        {!connected && (
          <>
            <label htmlFor="api-key">Connect {providers.find((p) => p.id === provider)?.label}</label>
            <input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              placeholder="Enter API key"
              disabled={busy}
            />
            <button type="button" onClick={connectProvider} disabled={busy || !apiKey.trim()}>
              {busy ? 'Connecting...' : 'Connect'}
            </button>
          </>
        )}

        {connected && (
          <>
            <button type="button" onClick={openSidepanel} disabled={busy}>
              Open Sidepanel
            </button>
            <button type="button" className="secondary" onClick={disconnectProvider} disabled={busy}>
              Disconnect
            </button>
          </>
        )}

        <div className="status-row">
          <span className="provider-badge">{providerBadge}</span>
          <span>{status}</span>
        </div>
      </section>
    </main>
  );
}
