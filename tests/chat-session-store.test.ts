import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createSession,
  listSessions,
  getSession,
  renameSession,
  archiveSession,
  addMessage,
  getMessages,
  addContextEvent,
  getContextEvents
} from '@ai/shared/chat-session/store';

describe('chat-session store', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('createSession', () => {
    it('creates a session with correct providerId', () => {
      const session = createSession('gemini');
      expect(session.providerId).toBe('gemini');
      expect(session.id).toBeDefined();
      expect(session.title).toBeDefined();
      expect(session.archived).toBe(false);
    });

    it('persists created session', () => {
      const session = createSession('claude');
      const sessions = listSessions();
      expect(sessions.some((s) => s.id === session.id)).toBe(true);
    });

    it('created session appears first in list', () => {
      createSession('gemini');
      const second = createSession('claude');
      const sessions = listSessions();
      expect(sessions[0]!.id).toBe(second.id);
    });
  });

  describe('listSessions', () => {
    it('returns empty array when no sessions', () => {
      expect(listSessions()).toEqual([]);
    });

    it('returns all non-archived sessions', () => {
      const s1 = createSession('gemini');
      const s2 = createSession('claude');
      archiveSession(s1.id);

      const sessions = listSessions();
      expect(sessions.some((s) => s.id === s2.id)).toBe(true);
      expect(sessions.some((s) => s.id === s1.id)).toBe(false);
    });
  });

  describe('getSession', () => {
    it('returns session by id', () => {
      const created = createSession('chatgpt');
      const found = getSession(created.id);
      expect(found?.id).toBe(created.id);
    });

    it('returns undefined for unknown id', () => {
      expect(getSession('nonexistent')).toBeUndefined();
    });
  });

  describe('renameSession', () => {
    it('updates session title', () => {
      const session = createSession('gemini');
      renameSession(session.id, 'New Title');
      expect(getSession(session.id)?.title).toBe('New Title');
    });
  });

  describe('archiveSession', () => {
    it('sets archived to true', () => {
      const session = createSession('gemini');
      archiveSession(session.id);
      const allSessions = listSessions();
      expect(allSessions.some((s) => s.id === session.id)).toBe(false);
    });
  });

  describe('addMessage / getMessages', () => {
    it('stores and retrieves messages by sessionId', () => {
      const session = createSession('gemini');
      addMessage({ sessionId: session.id, role: 'user', content: 'Hello!' });
      addMessage({ sessionId: session.id, role: 'assistant', content: 'Hi!' });

      const messages = getMessages(session.id);
      expect(messages).toHaveLength(2);
      expect(messages[0]!.content).toBe('Hello!');
      expect(messages[1]!.content).toBe('Hi!');
    });

    it('does not return messages for other sessions', () => {
      const s1 = createSession('gemini');
      const s2 = createSession('claude');
      addMessage({ sessionId: s1.id, role: 'user', content: 'S1 message' });

      expect(getMessages(s2.id)).toHaveLength(0);
    });
  });

  describe('addContextEvent / getContextEvents', () => {
    it('stores and retrieves context events by sessionId', () => {
      const session = createSession('gemini');
      addContextEvent({
        sessionId: session.id,
        type: 'url',
        label: 'Page URL',
        payload: 'https://example.com'
      });

      const events = getContextEvents(session.id);
      expect(events).toHaveLength(1);
      expect(events[0]!.payload).toBe('https://example.com');
    });
  });
});
