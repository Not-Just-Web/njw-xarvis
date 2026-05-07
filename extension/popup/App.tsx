import { useMemo, useState } from 'react';

const providers = ['Gemini', 'Claude', 'ChatGPT'] as const;

export function PopupApp(): JSX.Element {
  const [provider, setProvider] = useState<(typeof providers)[number]>('Gemini');
  const [status, setStatus] = useState('Ready');

  const providerBadge = useMemo(() => provider.toUpperCase(), [provider]);

  const openSidepanel = async () => {
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
        <p className="eyebrow">AI Assistant</p>
        <h1>Quick Launch</h1>
      </header>

      <section className="panel">
        <label htmlFor="provider">Provider</label>
        <select
          id="provider"
          value={provider}
          onChange={(event) => setProvider(event.target.value as (typeof providers)[number])}
        >
          {providers.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <button type="button" onClick={openSidepanel}>
          Open Sidepanel
        </button>

        <div className="status-row">
          <span className="provider-badge">{providerBadge}</span>
          <span>{status}</span>
        </div>
      </section>
    </main>
  );
}
