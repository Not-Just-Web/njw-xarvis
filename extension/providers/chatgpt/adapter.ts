import type {
  ProviderAdapter,
  ProviderAuthConfig,
  ProviderSendPayload,
  ProviderSendResult
} from '../../../shared/provider-contract/types';

const OPENAI_API_BASE = 'https://api.openai.com/v1';
const CHATGPT_MODEL = 'gpt-4o-mini';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIRequest {
  model: string;
  max_tokens: number;
  temperature: number;
  messages: OpenAIMessage[];
}

interface OpenAIResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
  }>;
  usage?: {
    completion_tokens: number;
  };
}

class ChatGPTAdapter implements ProviderAdapter {
  id = 'chatgpt' as const;
  displayName = 'OpenAI ChatGPT';
  supports = {
    vision: true,
    tools: false,
    maxContextBytes: 128000
  };

  private apiKey: string | null = null;

  async authenticate(config: ProviderAuthConfig): Promise<boolean> {
    if (!config.token) {
      console.warn('[ChatGPT] No API key provided');
      return false;
    }

    this.apiKey = config.token;
    try {
      // Test auth with a minimal request
      const testResponse = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: CHATGPT_MODEL,
          max_tokens: 100,
          messages: [{ role: 'user', content: 'test' }]
        })
      });

      if (!testResponse.ok) {
        console.error(`[ChatGPT] Auth test failed: ${testResponse.status}`);
        this.apiKey = null;
        return false;
      }

      return true;
    } catch (error) {
      console.error('[ChatGPT] Auth test error:', error);
      this.apiKey = null;
      return false;
    }
  }

  async sendMessage(payload: ProviderSendPayload): Promise<ProviderSendResult> {
    if (!this.apiKey) {
      throw new Error('[ChatGPT] Not authenticated. Call authenticate() first.');
    }

    // Convert to OpenAI format
    const messages: OpenAIMessage[] = payload.messages.map((msg) => ({
      role: msg.role as 'system' | 'user' | 'assistant',
      content: msg.content
    }));

    if (messages.length === 0) {
      throw new Error('[ChatGPT] No messages to send');
    }

    const request: OpenAIRequest = {
      model: CHATGPT_MODEL,
      max_tokens: 2048,
      temperature: 0.7,
      messages
    };

    try {
      const response = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`[ChatGPT] API error ${response.status}: ${errorText}`);
      }

      const data = (await response.json()) as OpenAIResponse;

      const textContent = data.choices?.[0]?.message?.content ?? '';
      if (!textContent) {
        throw new Error('[ChatGPT] No text in response');
      }

      return {
        text: textContent,
        model: CHATGPT_MODEL,
        tokensUsed: data.usage?.completion_tokens
      };
    } catch (error) {
      throw new Error(`[ChatGPT] Send failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export const chatgptAdapter = new ChatGPTAdapter();
