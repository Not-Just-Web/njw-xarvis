export type SessionId = string;

export type ContextEventType = 'url' | 'selection' | 'element' | 'screenshot' | 'image';

export type ContextEvent = {
  id: string;
  sessionId: SessionId;
  type: ContextEventType;
  label: string;
  payload: string;
  createdAt: string;
};

export type ChatMessage = {
  id: string;
  sessionId: SessionId;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
};

export type ChatSession = {
  id: SessionId;
  title: string;
  providerId: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
};
