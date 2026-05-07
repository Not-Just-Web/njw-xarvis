import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import authRouter from '../../src/routes/auth';

// Create a test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/auth', authRouter);
  return app;
};

describe('Auth Routes', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('POST /auth/token', () => {
    it('should return 400 if extensionId is missing', async () => {
      const response = await request(app)
        .post('/auth/token')
        .send({
          providerId: 'gemini',
          credentials: { apiKey: 'test-key' }
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required fields');
    });

    it('should return 400 if providerId is missing', async () => {
      const response = await request(app)
        .post('/auth/token')
        .send({
          extensionId: 'ext-1',
          credentials: { apiKey: 'test-key' }
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required fields');
    });

    it('should return 400 if credentials are missing', async () => {
      const response = await request(app)
        .post('/auth/token')
        .send({
          extensionId: 'ext-1',
          providerId: 'gemini'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required fields');
    });

    it('should return 401 if credentials are invalid', async () => {
      const response = await request(app)
        .post('/auth/token')
        .send({
          extensionId: 'ext-1',
          providerId: 'gemini',
          credentials: { apiKey: '' } // Empty API key
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Invalid credentials');
    });

    it('should generate a valid token for valid credentials', async () => {
      const response = await request(app)
        .post('/auth/token')
        .send({
          extensionId: 'ext-1',
          providerId: 'gemini',
          credentials: { apiKey: 'valid-key-123' }
        });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
      expect(response.body.expiresIn).toBe(86400); // 24 hours
      expect(response.body.provider).toBe('gemini');
      expect(response.body.message).toContain('Token granted successfully');
    });

    it('should support multiple providers', async () => {
      const providers = ['gemini', 'claude', 'chatgpt'];

      for (const provider of providers) {
        const response = await request(app)
          .post('/auth/token')
          .send({
            extensionId: 'ext-1',
            providerId: provider,
            credentials: { apiKey: 'valid-key-123' }
          });

        expect(response.status).toBe(200);
        expect(response.body.provider).toBe(provider);
        expect(response.body.token).toBeDefined();
      }
    });
  });

  describe('POST /auth/validate', () => {
    let validToken: string;

    beforeEach(async () => {
      // Get a valid token first
      const tokenResponse = await request(app)
        .post('/auth/token')
        .send({
          extensionId: 'ext-1',
          providerId: 'gemini',
          credentials: { apiKey: 'valid-key-123' }
        });
      validToken = tokenResponse.body.token;
    });

    it('should return 400 if token is missing', async () => {
      const response = await request(app)
        .post('/auth/validate')
        .send({
          extensionId: 'ext-1',
          providerId: 'gemini'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Token required');
    });

    it('should return 401 for invalid token', async () => {
      const response = await request(app)
        .post('/auth/validate')
        .send({
          token: 'invalid-token',
          extensionId: 'ext-1',
          providerId: 'gemini'
        });

      expect(response.status).toBe(401);
      expect(response.body.valid).toBe(false);
    });

    it('should return 401 if extensionId does not match token', async () => {
      const response = await request(app)
        .post('/auth/validate')
        .send({
          token: validToken,
          extensionId: 'ext-wrong',
          providerId: 'gemini'
        });

      expect(response.status).toBe(401);
      expect(response.body.valid).toBe(false);
      expect(response.body.error).toContain('Token mismatch');
    });

    it('should return 401 if providerId does not match token', async () => {
      const response = await request(app)
        .post('/auth/validate')
        .send({
          token: validToken,
          extensionId: 'ext-1',
          providerId: 'claude'
        });

      expect(response.status).toBe(401);
      expect(response.body.valid).toBe(false);
      expect(response.body.error).toContain('Token mismatch');
    });

    it('should validate a correct token', async () => {
      const response = await request(app)
        .post('/auth/validate')
        .send({
          token: validToken,
          extensionId: 'ext-1',
          providerId: 'gemini'
        });

      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(true);
      expect(response.body.provider).toBe('gemini');
      expect(response.body.message).toContain('Token is valid');
    });
  });

  describe('POST /auth/refresh', () => {
    let validToken: string;

    beforeEach(async () => {
      const tokenResponse = await request(app)
        .post('/auth/token')
        .send({
          extensionId: 'ext-1',
          providerId: 'gemini',
          credentials: { apiKey: 'valid-key-123' }
        });
      validToken = tokenResponse.body.token;
    });

    it('should return 400 if token is missing', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({
          extensionId: 'ext-1',
          providerId: 'gemini'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Token required');
    });

    it('should return 401 for invalid token', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({
          token: 'invalid-token',
          extensionId: 'ext-1',
          providerId: 'gemini'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Failed to refresh token');
    });

    it('should return 401 if extensionId does not match', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({
          token: validToken,
          extensionId: 'ext-wrong',
          providerId: 'gemini'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Token mismatch');
    });

    it('should refresh a valid token', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({
          token: validToken,
          extensionId: 'ext-1',
          providerId: 'gemini'
        });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
      expect(response.body.token).not.toBe(validToken); // New token
      expect(response.body.expiresIn).toBe(86400);
      expect(response.body.provider).toBe('gemini');
      expect(response.body.message).toContain('Token refreshed successfully');
    });

    it('should return different token on refresh', async () => {
      const response1 = await request(app)
        .post('/auth/refresh')
        .send({
          token: validToken,
          extensionId: 'ext-1',
          providerId: 'gemini'
        });

      const newToken = response1.body.token;

      // Validate that new token works
      const response2 = await request(app)
        .post('/auth/validate')
        .send({
          token: newToken,
          extensionId: 'ext-1',
          providerId: 'gemini'
        });

      expect(response2.status).toBe(200);
      expect(response2.body.valid).toBe(true);
    });
  });

  describe('POST /auth/revoke', () => {
    it('should return 400 if extensionId is missing', async () => {
      const response = await request(app)
        .post('/auth/revoke')
        .send({
          providerId: 'gemini'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing extensionId or providerId');
    });

    it('should return 400 if providerId is missing', async () => {
      const response = await request(app)
        .post('/auth/revoke')
        .send({
          extensionId: 'ext-1'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing extensionId or providerId');
    });

    it('should revoke a token successfully', async () => {
      const response = await request(app)
        .post('/auth/revoke')
        .send({
          extensionId: 'ext-1',
          providerId: 'gemini'
        });

      expect(response.status).toBe(200);
      expect(response.body.revoked).toBe(true);
      expect(response.body.provider).toBe('gemini');
      expect(response.body.message).toContain('Token revoked successfully');
    });

    it('should handle multiple revokes for same provider', async () => {
      // First revoke
      const response1 = await request(app)
        .post('/auth/revoke')
        .send({
          extensionId: 'ext-1',
          providerId: 'gemini'
        });
      expect(response1.status).toBe(200);

      // Second revoke (should also succeed)
      const response2 = await request(app)
        .post('/auth/revoke')
        .send({
          extensionId: 'ext-1',
          providerId: 'gemini'
        });
      expect(response2.status).toBe(200);
      expect(response2.body.revoked).toBe(true);
    });
  });
});
