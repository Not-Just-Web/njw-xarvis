import { Router, Request, Response } from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';

const router = Router();
const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// In-memory storage of API keys (replace with secure database in production)
const providerKeys = new Map<string, Map<string, string>>();

/**
 * Middleware: Verify JWT token and extract provider info
 */
function verifyToken(req: Request, res: Response, next: Function): void {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or invalid authorization header' });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, SECRET_KEY) as any;

    (req as any).extensionId = decoded.extensionId;
    (req as any).providerId = decoded.providerId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * POST /provider/message
 * Proxy AI provider API calls
 * Request: { model: string, messages: Array, ... provider-specific options }
 * Authorization: Bearer <token>
 */
router.post('/message', verifyToken, async (req: Request, res: Response) => {
  try {
    const extensionId = (req as any).extensionId;
    const providerId = (req as any).providerId;
    const payload = req.body;

    // Get API key for this provider (stored during token exchange)
    const apiKey = getProviderApiKey(extensionId, providerId);
    if (!apiKey) {
      return res.status(401).json({ error: `No API key stored for ${providerId}` });
    }

    // Proxy request to appropriate provider
    const response = await proxyToProvider(providerId, apiKey, payload);
    res.json(response);
    return;
  } catch (error) {
    console.error(`[${req.id}] Provider proxy error:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Provider request failed';
    res.status(500).json({ error: errorMessage });
    return;
  }
});

/**
 * GET /provider/health
 * Check if all providers are accessible
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = {
      gemini: { status: 'unknown' },
      claude: { status: 'unknown' },
      chatgpt: { status: 'unknown' }
    };

    // In production: make actual API calls with test credentials
    // For now: just report as configured

    res.json({
      timestamp: new Date().toISOString(),
      providers: health,
      message: 'Use /provider/:providerId/health for provider-specific status'
    });
  } catch (error) {
    res.status(500).json({ error: 'Health check failed' });
  }
});

/**
 * GET /provider/:providerId/health
 * Check specific provider availability
 */
router.get('/:providerId/health', async (req: Request, res: Response) => {
  try {
    const { providerId } = req.params;
    if (!providerId) {
      res.status(400).json({ error: 'providerId is required' });
      return;
    }
    const isHealthy = await checkProviderHealth(providerId);

    res.json({
      provider: providerId,
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: `Failed to check ${req.params.providerId} health` });
  }
});

/**
 * Proxy requests to the appropriate AI provider
 */
async function proxyToProvider(providerId: string, apiKey: string, payload: any): Promise<any> {
  switch (providerId) {
    case 'gemini':
      return proxyGemini(apiKey, payload);
    case 'claude':
      return proxyClaud(apiKey, payload);
    case 'chatgpt':
      return proxyChatGpt(apiKey, payload);
    default:
      throw new Error(`Unknown provider: ${providerId}`);
  }
}

async function proxyGemini(apiKey: string, payload: any): Promise<any> {
  const { model = 'gemini-2.0-flash', messages, ...options } = payload;

  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      contents: messages.map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      })),
      ...options
    }
  );

  return {
    text: response.data.candidates?.[0]?.content?.parts?.[0]?.text || '',
    model,
    provider: 'gemini'
  };
}

async function proxyClaud(apiKey: string, payload: any): Promise<any> {
  const { model = 'claude-3-5-sonnet-20241022', messages, ...options } = payload;

  const response = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model,
      messages,
      max_tokens: options.maxTokens || 1024,
      ...options
    },
    {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      }
    }
  );

  return {
    text: response.data.content?.[0]?.text || '',
    model,
    provider: 'claude'
  };
}

async function proxyChatGpt(apiKey: string, payload: any): Promise<any> {
  const { model = 'gpt-4o', messages, ...options } = payload;

  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model,
      messages,
      ...options
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    }
  );

  return {
    text: response.data.choices?.[0]?.message?.content || '',
    model,
    provider: 'chatgpt'
  };
}

async function checkProviderHealth(providerId: string): Promise<boolean> {
  try {
    // In production: check provider status endpoint
    // For now: consider all providers healthy if they have endpoints
    return ['gemini', 'claude', 'chatgpt'].includes(providerId);
  } catch (error) {
    return false;
  }
}

function getProviderApiKey(extensionId: string, providerId: string): string | undefined {
  return providerKeys.get(extensionId)?.get(providerId);
}

export default router;
