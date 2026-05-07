export type ProviderId = 'gemini' | 'claude' | 'chatgpt' | `custom:${string}`;

export type ProviderCapability = {
  vision: boolean;
  tools: boolean;
  maxContextBytes: number;
};

export type ProviderAuthConfig = {
  token?: string;
  endpoint?: string;
};

export type ChatMessageInput = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type ProviderSendPayload = {
  sessionId: string;
  messages: ChatMessageInput[];
  contextEvents: string[];
};

export type ProviderSendResult = {
  text: string;
  model: string;
  tokensUsed?: number;
};

export interface ProviderAdapter {
  id: ProviderId;
  displayName: string;
  supports: ProviderCapability;
  authenticate(config: ProviderAuthConfig): Promise<boolean>;
  sendMessage(payload: ProviderSendPayload): Promise<ProviderSendResult>;
}
