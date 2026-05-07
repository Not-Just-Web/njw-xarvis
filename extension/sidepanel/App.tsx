import { useState } from 'react';
import { defaultSkills } from '../shared/skills';

type Message = {
  id: string;
  role: 'assistant' | 'user';
  text: string;
};

const initialMessages: Message[] = [
  { id: '1', role: 'assistant', text: 'I can help test this page. Share context to begin.' },
  { id: '2', role: 'user', text: 'Please capture current section and summarize risk.' }
];

export function SidepanelApp(): JSX.Element {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [value, setValue] = useState('');

  const send = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }

    setMessages((prev) => [...prev, { id: String(Date.now()), role: 'user', text: trimmed }]);
    setValue('');
  };

  return (
    <main className="sp-shell">
      <aside className="sessions" aria-label="Sessions">
        <button className="new-chat" type="button">
          + New Chat
        </button>
        <ul>
          <li className="active">Checkout QA - Active</li>
          <li>Payment Regression</li>
          <li>Landing UX Review</li>
        </ul>
      </aside>

      <section className="chat-area">
        <header className="topbar">
          <div>
            <p className="eyebrow">AI Assistant</p>
            <h1>Sidepanel Chat</h1>
          </div>
          <span className="provider-pill">Gemini</span>
        </header>

        <section className="timeline" aria-label="Messages">
          {messages.map((message) => (
            <article key={message.id} className={`bubble ${message.role}`}>
              {message.text}
            </article>
          ))}
        </section>

        <footer className="composer">
          <div className="chips">
            <span>URL</span>
            <span>Element</span>
            <span>Screenshot</span>
          </div>

          <div className="skills" aria-label="Default skills">
            {defaultSkills.map((skill) => (
              <button key={skill} type="button" onClick={() => setValue(skill + ' ')}>
                {skill}
              </button>
            ))}
          </div>

          <textarea
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                send();
              }
            }}
            rows={3}
            placeholder="Type message, Enter to send, Shift+Enter for newline"
          />

          <div className="actions">
            <button type="button" className="secondary">
              Capture Screenshot
            </button>
            <button type="button" className="primary" onClick={send}>
              Send
            </button>
          </div>
        </footer>
      </section>
    </main>
  );
}
