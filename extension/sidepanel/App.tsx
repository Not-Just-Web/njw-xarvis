import { useCallback, useEffect, useRef, useState } from 'react';
import { defaultSkills } from '../shared/skills';
import {
  addMessage,
  createSession,
  getMessages,
  listSessions
} from '../../shared/chat-session/store';
import type { ChatMessage, ChatSession } from '../../shared/chat-session/types';
import type { CapturedContext } from '../content-script/selection';

type ContextChip = CapturedContext & { id: string };

const randomId = () => Math.random().toString(36).slice(2, 8);

export function SidepanelApp(): JSX.Element {
  const [sessions, setSessions] = useState<ChatSession[]>(() => listSessions());
  const [activeSession, setActiveSession] = useState<ChatSession | null>(() => {
    const existing = listSessions();
    if (existing[0]) return existing[0];
    return createSession('gemini');
  });
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    activeSession ? getMessages(activeSession.id) : []
  );
  const [value, setValue] = useState('');
  const [chips, setChips] = useState<ContextChip[]>([]);
  const [sessionOpen, setSessionOpen] = useState(true);
  const [skillHint, setSkillHint] = useState(false);
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
    const session = createSession('gemini');
    setSessions(listSessions());
    switchSession(session);
  };

  const addChip = useCallback((ctx: CapturedContext) => {
    setChips((prev) => [...prev, { ...ctx, id: randomId() }]);
  }, []);

  const removeChip = (id: string) => setChips((prev) => prev.filter((c) => c.id !== id));

  const captureUrl = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id === undefined) return;
    const res = await chrome.tabs.sendMessage(tab.id, { type: 'capture.url' }) as { context?: CapturedContext } | undefined;
    if (res?.context) addChip(res.context);
  };

  const captureSelection = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id === undefined) return;
    const res = await chrome.tabs.sendMessage(tab.id, { type: 'capture.selection' }) as { context?: CapturedContext } | undefined;
    if (res?.context) addChip(res.context);
  };

  const captureScreenshot = async () => {
    const response = await chrome.runtime.sendMessage({ type: 'capture.screenshot' }) as { context?: CapturedContext } | undefined;
    if (response?.context) addChip(response.context);
  };

  const send = () => {
    const trimmed = value.trim();
    if (!trimmed || !activeSession) return;

    const msg = addMessage({ sessionId: activeSession.id, role: 'user', content: trimmed });
    setMessages((prev) => [...prev, msg]);

    const reply = addMessage({
      sessionId: activeSession.id,
      role: 'assistant',
      content: '…thinking (provider not connected yet)'
    });
    setMessages((prev) => [...prev, reply]);
    setValue('');
    setChips([]);
    setSkillHint(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      send();
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
    <main className="sp-shell" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
      {sessionOpen && (
        <aside className="sessions" aria-label="Sessions">
          <button className="new-chat" type="button" onClick={newChat}>
            + New Chat
          </button>
          <ul>
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
      )}

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
              <p className="eyebrow">AI Assistant</p>
              <h1>{activeSession?.title ?? 'Chat'}</h1>
            </div>
          </div>
          <span className="provider-pill">Gemini</span>
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
            <button type="button" onClick={captureUrl} title="Capture page URL">URL</button>
            <button type="button" onClick={captureSelection} title="Capture selected text">Text</button>
            <button type="button" onClick={captureScreenshot} title="Capture screenshot">Screenshot</button>
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
            <button type="button" className="primary" onClick={send}>
              Send
            </button>
          </div>
        </footer>
      </section>
    </main>
  );
}
