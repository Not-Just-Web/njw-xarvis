import { useCallback, useEffect, useRef, useState } from 'react';
import { defaultSkills } from '../shared/skills';
import { addMessage, createSession, getMessages, listSessions } from '../../shared/chat-session/store';
import type { ChatMessage, ChatSession } from '../../shared/chat-session/types';
import type { CapturedContext } from '../content-script/selection';
import type { ProviderId } from '../../shared/provider-contract/types';

type ContextChip = CapturedContext & { id: string };

type RuntimeResponse = {
  type: 'response';
  payload: {
    ok?: boolean;
    text?: string;
    error?: string;
    providerId?: ProviderId;
    connected?: boolean;
  };
};

const randomId = () => Math.random().toString(36).slice(2, 8);
const hasChrome = typeof chrome !== 'undefined';

export function SidepanelApp(): JSX.Element {
  const [sessions, setSessions] = useState<ChatSession[]>(() => listSessions());
  const [activeSession, setActiveSession] = useState<ChatSession | null>(() => listSessions()[0] ?? null);
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    activeSession ? getMessages(activeSession.id) : []
  );
  const [value, setValue] = useState('');
  const [chips, setChips] = useState<ContextChip[]>([]);
  const [sessionOpen, setSessionOpen] = useState(true);
  const [skillHint, setSkillHint] = useState(false);
  const [providerId, setProviderId] = useState<ProviderId>('gemini');
  const [providerConnected, setProviderConnected] = useState(false);
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (timelineRef.current) {
      timelineRef.current.scrollTop = timelineRef.current.scrollHeight;
    }
  }, [messages]);

  const switchSession = (session: ChatSession) => {
    setActiveSession(session);
    setMessages(getMessages(session.id));
    setChips([]);
    setValue('');
  };

  const newChat = () => {
    const session = createSession(providerId);
    setSessions(listSessions());
    switchSession(session);
  };

  useEffect(() => {
    if (!hasChrome || !chrome.runtime?.sendMessage) {
      return;
    }

    const syncProvider = async () => {
      const activeRes = (await chrome.runtime.sendMessage({
        type: 'provider.getActive',
        payload: {}
      })) as RuntimeResponse;

      const active = (activeRes.payload.providerId ?? 'gemini') as ProviderId;
      setProviderId(active);

      const statusRes = (await chrome.runtime.sendMessage({
        type: 'provider.getAuthStatus',
        payload: { providerId: active }
      })) as RuntimeResponse;

      setProviderConnected(statusRes.payload.ok === true && statusRes.payload.connected === true);
    };

    syncProvider().catch(() => {
      setProviderConnected(false);
    });
  }, []);

  const addChip = useCallback((ctx: CapturedContext) => {
    setChips((prev) => [...prev, { ...ctx, id: randomId() }]);
  }, []);

  const removeChip = (id: string) => setChips((prev) => prev.filter((c) => c.id !== id));

  const captureUrl = async () => {
    if (!hasChrome || !chrome.tabs?.query || !chrome.tabs?.sendMessage) {
      addChip({ type: 'url', label: 'Page URL', payload: window.location.href });
      return;
    }
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id === undefined) return;
    const res = (await chrome.tabs.sendMessage(tab.id, { type: 'capture.url' })) as
      | { context?: CapturedContext }
      | undefined;
    if (res?.context) addChip(res.context);
  };

  const captureSelection = async () => {
    if (!hasChrome || !chrome.tabs?.query || !chrome.tabs?.sendMessage) {
      const selectedText = window.getSelection()?.toString().trim();
      if (!selectedText) return;
      addChip({ type: 'selection', label: 'Selected Text', payload: selectedText });
      return;
    }
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id === undefined) return;
    const res = (await chrome.tabs.sendMessage(tab.id, { type: 'capture.selection' })) as
      | { context?: CapturedContext }
      | undefined;
    if (res?.context) addChip(res.context);
  };

  const captureScreenshot = async () => {
    if (!hasChrome || !chrome.runtime?.sendMessage) {
      addChip({
        type: 'screenshot',
        label: 'Screenshot (Extension Only)',
        payload: 'Screenshot capture is available in the installed browser extension.'
      });
      return;
    }
    const response = (await chrome.runtime.sendMessage({ type: 'capture.screenshot' })) as
      | { context?: CapturedContext }
      | undefined;
    if (response?.context) addChip(response.context);
  };

  const send = async () => {
    const trimmed = value.trim();
    if (!trimmed || sending) return;

    let targetSession = activeSession;
    if (!targetSession) {
      targetSession = createSession(providerId);
      setSessions(listSessions());
      setActiveSession(targetSession);
    }

    const userMessage = addMessage({ sessionId: targetSession.id, role: 'user', content: trimmed });
    setMessages((prev) => [...prev, userMessage]);
    setValue('');
    setSkillHint(false);

    if (!providerConnected || !hasChrome || !chrome.runtime?.sendMessage) {
      const disconnectedReply = addMessage({
        sessionId: targetSession.id,
        role: 'assistant',
        content:
          'Provider is not connected. Open popup, connect your provider API key, then use Quick Launch.'
      });
      setMessages((prev) => [...prev, disconnectedReply]);
      setChips([]);
      return;
    }

    try {
      setSending(true);
      const response = (await chrome.runtime.sendMessage({
        type: 'chat.send',
        payload: {
          sessionId: targetSession.id,
          prompt: trimmed,
          context: chips.map((chip) => ({
            id: chip.id,
            sessionId: targetSession.id,
            type: chip.type,
            label: chip.label,
            payload: chip.payload,
            createdAt: new Date().toISOString()
          }))
        }
      })) as RuntimeResponse;

      const content =
        response.payload.ok === true && response.payload.text
          ? response.payload.text
          : (response.payload.error ?? 'Could not send message. Reconnect provider from popup.');

      const assistantReply = addMessage({ sessionId: targetSession.id, role: 'assistant', content });
      setMessages((prev) => [...prev, assistantReply]);
    } catch {
      const errorReply = addMessage({
        sessionId: targetSession.id,
        role: 'assistant',
        content: 'Network error while sending message. Try again.'
      });
      setMessages((prev) => [...prev, errorReply]);
    } finally {
      setSending(false);
      setChips([]);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void send();
    }
  };

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = event.target.value;
    setValue(v);
    setSkillHint(v.startsWith('/'));
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (!file?.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      addChip({ type: 'image', label: `Image: ${file.name}`, payload: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const item = Array.from(event.clipboardData.items).find((i) => i.type.startsWith('image/'));
    if (!item) return;
    const file = item.getAsFile();
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      addChip({ type: 'image', label: 'Pasted Image', payload: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  return (
    <main className={`sp-shell ${sessionOpen ? 'sessions-open' : 'sessions-closed'}`} onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
      <aside className="sessions" aria-label="Sessions">
        <button className="new-chat" type="button" onClick={newChat}>
          + New Chat
        </button>
        <ul>
          {sessions.length === 0 && <li className="empty">No previous session</li>}
          {sessions.map((s) => (
            <li
              key={s.id}
              className={s.id === activeSession?.id ? 'active' : ''}
              onClick={() => switchSession(s)}
            >
              {s.title}
            </li>
          ))}
        </ul>
      </aside>

      <section className="chat-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="hamburger"
              aria-label="Toggle sessions"
              onClick={() => setSessionOpen((o) => !o)}
            >
              ☰
            </button>
            <div>
              <p className="eyebrow">NJW Xarvis</p>
              <h1>{activeSession?.title ?? 'Chat'}</h1>
            </div>
          </div>
          <span className="provider-pill">
            {providerId.charAt(0).toUpperCase() + providerId.slice(1)} · {providerConnected ? 'Connected' : 'Disconnected'}
          </span>
        </header>

        <section className="timeline" ref={timelineRef} aria-label="Messages">
          {messages.length === 0 && (
            <p className="empty-state">Start by typing a message or attaching context below.</p>
          )}
          {messages.map((message) => (
            <article key={message.id} className={`bubble ${message.role}`}>
              {message.content}
            </article>
          ))}
        </section>

        <footer className="composer">
          {chips.length > 0 && (
            <div className="chips" aria-label="Context chips">
              {chips.map((chip) => (
                <span key={chip.id} className="chip">
                  {chip.label}
                  <button type="button" aria-label="Remove" onClick={() => removeChip(chip.id)}>
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="capture-bar">
            <button type="button" onClick={() => void captureUrl()} title="Capture page URL">URL</button>
            <button type="button" onClick={() => void captureSelection()} title="Capture selected text">Text</button>
            <button type="button" onClick={() => void captureScreenshot()} title="Capture screenshot">Screenshot</button>
          </div>

          {skillHint && (
            <div className="skills" aria-label="Slash skills">
              {defaultSkills
                .filter((s) => s.startsWith(value))
                .map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setValue(skill + ' ');
                      setSkillHint(false);
                      textareaRef.current?.focus();
                    }}
                  >
                    {skill}
                  </button>
                ))}
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            rows={3}
            placeholder="Type message, Enter to send, Shift+Enter for newline. Paste or drop an image."
          />

          <div className="actions">
            <button type="button" className="primary" onClick={() => void send()} disabled={sending}>
              {sending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </footer>
      </section>
    </main>
  );
}
