import type {
  ProviderAdapter,
  ProviderAuthConfig,
  ProviderSendPayload,
  ProviderSendResult
} from '../../../shared/provider-contract/types';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_MODEL = 'gemini-2.0-flash';

interface GeminiMessage {
  role: 'model' | 'user';
  parts: Array<{ text: string }>;
}

interface GeminiRequest {
  contents: GeminiMessage[];
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
  };
}

interface GeminiResponse {
  candidates?: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
  }>;
  usageMetadata?: {
    outputTokenCount: number;
  };
}

class GeminiAdapter implements ProviderAdapter {
  id = 'gemini' as const;
  displayName = 'Google Gemini';
  supports = {
    vision: true,
    tools: false,
    maxContextBytes: 1000000
  };

  private apiKey: string | null = null;

  async authenticate(config: ProviderAuthConfig): Promise<boolean> {
    if (!config.token) {
      console.warn('[Gemini] No API key provided');
      return false;
    }

    this.apiKey = config.token;
    try {
      // Test auth with a minimal request
      const testResponse = await fetch(
        `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: 'test' }] }]
          })
        }
      );

      if (!testResponse.ok) {
        console.error(`[Gemini] Auth test failed: ${testResponse.status}`);
        this.apiKey = null;
        return false;
      }

      return true;
    } catch (error) {
      console.error('[Gemini] Auth test error:', error);
      this.apiKey = null;
      return false;
    }
  }

  async sendMessage(payload: ProviderSendPayload): Promise<ProviderSendResult> {
    if (!this.apiKey) {
      throw new Error('[Gemini] Not authenticated. Call authenticate() first.');
    }

    // Convert to Gemini format (user/assistant → user/model)
    const contents: GeminiMessage[] = payload.messages
      .filter((msg) => msg.role !== 'system') // Gemini doesn't support system role in contents
      .map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

    if (contents.length === 0) {
      throw new Error('[Gemini] No messages to send');
    }

    const request: GeminiRequest = {
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048
      }
    };

    try {
      const response = await fetch(
        `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request)
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`[Gemini] API error ${response.status}: ${errorText}`);
      }

      const data = (await response.json()) as GeminiResponse;

      const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      if (!textContent) {
        throw new Error('[Gemini] No text in response');
      }

      return {
        text: textContent,
        model: GEMINI_MODEL,
        tokensUsed: data.usageMetadata?.outputTokenCount
      };
    } catch (error) {
      throw new Error(`[Gemini] Send failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export const geminiAdapter = new GeminiAdapter();
