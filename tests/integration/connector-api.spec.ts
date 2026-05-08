
import request from 'supertest';
import app from '../../connector-api/src/index.js';

describe('Connector API Integration', () => {
  it('GET /health should return status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('POST /auth/token should fail with missing fields', async () => {
    const res = await request(app).post('/auth/token').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Missing required fields/);
  });
});
