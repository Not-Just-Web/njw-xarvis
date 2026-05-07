import type {
  ProviderAdapter,
  ProviderAuthConfig,
  ProviderSendPayload,
  ProviderSendResult
} from '../../../shared/provider-contract/types';

const ANTHROPIC_API_BASE = 'https://api.anthropic.com/v1';
const CLAUDE_MODEL = 'claude-3-5-sonnet-20241022';

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ClaudeRequest {
  model: string;
  max_tokens: number;
  system?: string;
  messages: ClaudeMessage[];
}

interface ClaudeResponse {
  id: string;
  type: string;
  content: Array<{ type: string; text: string }>;
  usage?: {
    output_tokens: number;
  };
}

class ClaudeAdapter implements ProviderAdapter {
  id = 'claude' as const;
  displayName = 'Anthropic Claude';
  supports = {
    vision: true,
    tools: false,
    maxContextBytes: 200000
  };

  private apiKey: string | null = null;

  async authenticate(config: ProviderAuthConfig): Promise<boolean> {
    if (!config.token) {
      console.warn('[Claude] No API key provided');
      return false;
    }

    this.apiKey = config.token;
    try {
      // Test auth with a minimal request
      const testResponse = await fetch(`${ANTHROPIC_API_BASE}/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: CLAUDE_MODEL,
          max_tokens: 100,
          messages: [{ role: 'user', content: 'test' }]
        })
      });

      if (!testResponse.ok) {
        console.error(`[Claude] Auth test failed: ${testResponse.status}`);
        this.apiKey = null;
        return false;
      }

      return true;
    } catch (error) {
      console.error('[Claude] Auth test error:', error);
      this.apiKey = null;
      return false;
    }
  }

  async sendMessage(payload: ProviderSendPayload): Promise<ProviderSendResult> {
    if (!this.apiKey) {
      throw new Error('[Claude] Not authenticated. Call authenticate() first.');
    }

    // Extract system message if present
    const systemMessage = payload.messages.find((msg) => msg.role === 'system')?.content;

    // Convert to Claude format (exclude system from messages array)
    const messages: ClaudeMessage[] = payload.messages
      .filter((msg) => msg.role !== 'system')
      .map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }));

    if (messages.length === 0) {
      throw new Error('[Claude] No messages to send');
    }

    const request: ClaudeRequest = {
      model: CLAUDE_MODEL,
      max_tokens: 2048,
      messages
    };

    if (systemMessage) {
      request.system = systemMessage;
    }

    try {
      const response = await fetch(`${ANTHROPIC_API_BASE}/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`[Claude] API error ${response.status}: ${errorText}`);
      }

      const data = (await response.json()) as ClaudeResponse;

      const textContent = data.content?.[0]?.text ?? '';
      if (!textContent) {
        throw new Error('[Claude] No text in response');
      }

      return {
        text: textContent,
        model: CLAUDE_MODEL,
        tokensUsed: data.usage?.output_tokens
      };
    } catch (error) {
      throw new Error(`[Claude] Send failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export const claudeAdapter = new ClaudeAdapter();
