import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

// Must match the fallback key used in provider-proxy.ts when JWT_SECRET is not set
const SECRET_KEY = 'your-secret-key-change-in-production';

const makeToken = (extensionId: string, providerId: string) =>
  jwt.sign({ extensionId, providerId, timestamp: Date.now() }, SECRET_KEY, { expiresIn: '1h' });

// Import after env setup
import providerRouter from '../../src/routes/provider-proxy';

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/provider', providerRouter);
  return app;
};

describe('Provider Proxy Routes', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    app = createTestApp();
    vi.clearAllMocks();
  });

  describe('GET /provider/health', () => {
    it('returns health status for all providers', async () => {
      const response = await request(app).get('/provider/health');

      expect(response.status).toBe(200);
      expect(response.body.providers).toBeDefined();
      expect(response.body.providers.gemini).toBeDefined();
      expect(response.body.providers.claude).toBeDefined();
      expect(response.body.providers.chatgpt).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('GET /provider/:providerId/health', () => {
    it('returns healthy for known providers', async () => {
      for (const id of ['gemini', 'claude', 'chatgpt']) {
        const response = await request(app).get(`/provider/${id}/health`);
        expect(response.status).toBe(200);
        expect(response.body.provider).toBe(id);
        expect(response.body.status).toBe('healthy');
      }
    });

    it('returns unhealthy for unknown provider', async () => {
      const response = await request(app).get('/provider/unknown/health');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('unhealthy');
    });
  });

  describe('POST /provider/message (auth middleware)', () => {
    it('returns 401 when no Authorization header', async () => {
      const response = await request(app)
        .post('/provider/message')
        .send({ messages: [] });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Missing or invalid authorization header');
    });

    it('returns 401 when token is invalid', async () => {
      const response = await request(app)
        .post('/provider/message')
        .set('Authorization', 'Bearer invalid-token')
        .send({ messages: [] });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Invalid or expired token');
    });

    it('returns 401 when no API key stored for provider', async () => {
      const token = makeToken('ext-1', 'gemini');

      const response = await request(app)
        .post('/provider/message')
        .set('Authorization', `Bearer ${token}`)
        .send({ messages: [{ role: 'user', content: 'hello' }] });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('No API key stored for');
    });
  });
});
