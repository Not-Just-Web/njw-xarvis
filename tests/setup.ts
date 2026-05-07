/**
 * Global test mocks and utilities
 * Shared across all test files to avoid duplication
 */

import { vi } from 'vitest';
import type { ProviderSendPayload, ProviderSendResult, ChatMessageInput } from '@ai/shared/provider-contract/types';
import type { ChatSession, ContextEvent } from '@ai/shared/chat-session/types';

// Mock API responses
export const mockProviderResponses = {
  gemini: {
    success: {
      candidates: [
        {
          content: {
            parts: [{ text: 'Mock Gemini response' }]
          }
        }
      ],
      usageMetadata: { outputTokenCount: 50 }
    }
  },
  claude: {
    success: {
      id: 'msg-123',
      type: 'message',
      content: [{ type: 'text', text: 'Mock Claude response' }],
      usage: { output_tokens: 50 }
    }
  },
  chatgpt: {
    success: {
      id: 'chatcmpl-123',
      model: 'gpt-4o-mini',
      choices: [
        {
          message: { role: 'assistant', content: 'Mock ChatGPT response' }
        }
      ],
      usage: { completion_tokens: 50 }
    }
  }
};

// Mock message factories
export const createMockMessage = (override: Partial<ChatMessageInput> = {}): ChatMessageInput => ({
  role: 'user',
  content: 'test message',
  ...override
});

export const createMockMessages = (count: number = 2): ChatMessageInput[] => {
  const messages: ChatMessageInput[] = [];
  for (let i = 0; i < count; i++) {
    messages.push(
      createMockMessage({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `message ${i + 1}`
      })
    );
  }
  return messages;
};

// Mock payload factory
export const createMockPayload = (override: Partial<ProviderSendPayload> = {}): ProviderSendPayload => ({
  sessionId: 'test-session-123',
  messages: createMockMessages(2),
  contextEvents: [],
  ...override
});

// Mock result factory
export const createMockResult = (override: Partial<ProviderSendResult> = {}): ProviderSendResult => ({
  text: 'Mock response',
  model: 'test-model-v1',
  tokensUsed: 100,
  ...override
});

// Mock session factory
export const createMockSession = (override: Partial<ChatSession> = {}): ChatSession => ({
  id: 'session-123',
  title: 'Test Session',
  providerId: 'gemini',
  archived: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...override
});

// Mock context event factory
export const createMockContextEvent = (override: Partial<ContextEvent> = {}): ContextEvent => ({
  id: 'event-123',
  sessionId: 'session-123',
  type: 'url',
  label: 'Page URL',
  payload: 'https://example.com',
  createdAt: new Date().toISOString(),
  ...override
});

// Fetch mock helper
export const mockFetch = (response: Record<string, unknown>, ok = true) => {
  return vi.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 400,
    json: vi.fn().mockResolvedValue(response),
    text: vi.fn().mockResolvedValue(JSON.stringify(response))
  });
};

// Storage mock helper
export const createMockStorage = () => {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach((key) => delete store[key]);
    })
  };
};

// Setup globals before tests
export const setupGlobalMocks = () => {
  // Mock fetch globally
  global.fetch = vi.fn();

  // Mock localStorage
  const mockStorage = createMockStorage();
  Object.defineProperty(window, 'localStorage', {
    value: mockStorage,
    writable: true
  });

  return { mockStorage };
};

// Clean up after tests
export const cleanupGlobalMocks = () => {
  vi.clearAllMocks();
};
