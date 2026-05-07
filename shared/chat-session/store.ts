import type { ChatMessage, ChatSession, ContextEvent, SessionId } from '../../shared/chat-session/types';

const SESSIONS_KEY = 'njw_xarvis_sessions';
const MESSAGES_KEY = 'njw_xarvis_messages';
const CONTEXT_KEY = 'njw_xarvis_context';

const generateId = (prefix: string): string =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

const loadJSON = <T>(key: string): T[] => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
};

const saveJSON = <T>(key: string, items: T[]): void => {
  localStorage.setItem(key, JSON.stringify(items));
};

export const createSession = (providerId: string): ChatSession => {
  const session: ChatSession = {
    id: generateId('session'),
    title: `Chat ${new Date().toLocaleTimeString()}`,
    providerId,
    archived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const sessions = loadJSON<ChatSession>(SESSIONS_KEY);
  sessions.unshift(session);
  saveJSON(SESSIONS_KEY, sessions);
  return session;
};

export const listSessions = (): ChatSession[] => {
  return loadJSON<ChatSession>(SESSIONS_KEY).filter((s) => !s.archived);
};

export const getSession = (sessionId: SessionId): ChatSession | undefined => {
  return loadJSON<ChatSession>(SESSIONS_KEY).find((s) => s.id === sessionId);
};

export const renameSession = (sessionId: SessionId, title: string): void => {
  const sessions = loadJSON<ChatSession>(SESSIONS_KEY).map((s) =>
    s.id === sessionId ? { ...s, title, updatedAt: new Date().toISOString() } : s
  );
  saveJSON(SESSIONS_KEY, sessions);
};

export const archiveSession = (sessionId: SessionId): void => {
  const sessions = loadJSON<ChatSession>(SESSIONS_KEY).map((s) =>
    s.id === sessionId ? { ...s, archived: true, updatedAt: new Date().toISOString() } : s
  );
  saveJSON(SESSIONS_KEY, sessions);
};

export const addMessage = (message: Omit<ChatMessage, 'id' | 'createdAt'>): ChatMessage => {
  const full: ChatMessage = {
    ...message,
    id: generateId('msg'),
    createdAt: new Date().toISOString()
  };
  const messages = loadJSON<ChatMessage>(MESSAGES_KEY);
  messages.push(full);
  saveJSON(MESSAGES_KEY, messages);
  return full;
};

export const getMessages = (sessionId: SessionId): ChatMessage[] => {
  return loadJSON<ChatMessage>(MESSAGES_KEY).filter((m) => m.sessionId === sessionId);
};

export const addContextEvent = (event: Omit<ContextEvent, 'id' | 'createdAt'>): ContextEvent => {
  const full: ContextEvent = {
    ...event,
    id: generateId('ctx'),
    createdAt: new Date().toISOString()
  };
  const events = loadJSON<ContextEvent>(CONTEXT_KEY);
  events.push(full);
  saveJSON(CONTEXT_KEY, events);
  return full;
};

export const getContextEvents = (sessionId: SessionId): ContextEvent[] => {
  return loadJSON<ContextEvent>(CONTEXT_KEY).filter((e) => e.sessionId === sessionId);
};
