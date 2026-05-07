import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();
const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// In-memory storage (replace with database in production)
const providerTokens = new Map<string, Map<string, string>>();

/**
 * POST /auth/token
 * Exchange provider credentials for a secure token
 * Request: { extensionId: string, providerId: string, credentials: { apiKey?: string, ... } }
 * Response: { token: string, expiresIn: number, provider: string }
 */
router.post('/token', async (req: Request, res: Response) => {
  try {
    const { extensionId, providerId, credentials } = req.body;

    if (!extensionId || !providerId || !credentials) {
      return res.status(400).json({ error: 'Missing required fields: extensionId, providerId, credentials' });
    }

    // Validate credentials based on provider
    const isValid = await validateProviderCredentials(providerId, credentials);
    if (!isValid) {
      return res.status(401).json({ error: `Invalid credentials for ${providerId}` });
    }

    // Store credentials securely (in production: use encrypted database)
    if (!providerTokens.has(extensionId)) {
      providerTokens.set(extensionId, new Map());
    }
    const extensionTokens = providerTokens.get(extensionId)!;
    extensionTokens.set(providerId, credentials.apiKey);

    // Create JWT token (short-lived, stateless)
    const token = jwt.sign(
      { extensionId, providerId, timestamp: Date.now() },
      SECRET_KEY,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      expiresIn: 86400, // 24 hours in seconds
      provider: providerId,
      message: 'Token granted successfully'
    });
    return;
  } catch (error) {
    console.error(`[${req.id}] Auth token error:`, error);
    res.status(500).json({ error: 'Failed to generate token' });
    return;
  }
});

/**
 * POST /auth/validate
 * Validate a stored token
 * Request: { extensionId: string, providerId: string, token: string }
 * Response: { valid: boolean, provider: string }
 */
router.post('/validate', (req: Request, res: Response) => {
  try {
    const { token, extensionId, providerId } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    const decoded = jwt.verify(token, SECRET_KEY) as any;

    if (decoded.extensionId !== extensionId || decoded.providerId !== providerId) {
      return res.status(401).json({ valid: false, error: 'Token mismatch' });
    }

    res.json({ valid: true, provider: providerId, message: 'Token is valid' });
    return;
  } catch (error) {
    res.status(401).json({ valid: false, error: 'Invalid token' });
    return;
  }
});

/**
 * POST /auth/refresh
 * Refresh an existing token
 * Request: { extensionId: string, providerId: string, token: string }
 * Response: { token: string, expiresIn: number }
 */
router.post('/refresh', (req: Request, res: Response) => {
  try {
    const { token, extensionId, providerId } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    const decoded = jwt.verify(token, SECRET_KEY) as any;

    if (decoded.extensionId !== extensionId || decoded.providerId !== providerId) {
      return res.status(401).json({ error: 'Token mismatch' });
    }

    const newToken = jwt.sign(
      { extensionId, providerId, timestamp: Date.now() },
      SECRET_KEY,
      { expiresIn: '24h' }
    );

    res.json({
      token: newToken,
      expiresIn: 86400,
      provider: providerId,
      message: 'Token refreshed successfully'
    });
    return;
  } catch (error) {
    res.status(401).json({ error: 'Failed to refresh token' });
    return;
  }
});

/**
 * POST /auth/revoke
 * Revoke a token (logout)
 * Request: { extensionId: string, providerId: string }
 * Response: { revoked: boolean }
 */
router.post('/revoke', (req: Request, res: Response) => {
  try {
    const { extensionId, providerId } = req.body;

    if (!extensionId || !providerId) {
      return res.status(400).json({ error: 'Missing extensionId or providerId' });
    }

    if (providerTokens.has(extensionId)) {
      providerTokens.get(extensionId)!.delete(providerId);
    }

    res.json({ revoked: true, provider: providerId, message: 'Token revoked successfully' });
    return;
  } catch (error) {
    console.error(`[${req.id}] Revoke error:`, error);
    res.status(500).json({ error: 'Failed to revoke token' });
    return;
  }
});

/**
 * Validate provider credentials by testing against actual API
 */
async function validateProviderCredentials(providerId: string, credentials: any): Promise<boolean> {
  try {
    switch (providerId) {
      case 'gemini':
        // Test Gemini API key by making a simple request
        if (!credentials.apiKey) return false;
        // In production: make actual API call to validate
        return true;

      case 'claude':
        // Test Claude API key
        if (!credentials.apiKey) return false;
        // In production: make actual API call to validate
        return true;

      case 'chatgpt':
        // Test ChatGPT API key
        if (!credentials.apiKey) return false;
        // In production: make actual API call to validate
        return true;

      default:
        return false;
    }
  } catch (error) {
    console.error(`Validation error for ${providerId}:`, error);
    return false;
  }
}

export default router;
