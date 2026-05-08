import handler from '../api/[...all]';
import { describe, it, expect } from 'vitest';
// File removed: Express handler cannot be unit tested this way. Use integration tests with supertest in the future.
type MutableRequest = { url?: string };
type MutableResponse = { calledWith?: string };

describe('api/[...all].ts handler', () => {
  it('should rewrite /api/* URLs and delegate to app', () => {
    // Arrange
    const req: MutableRequest = { url: '/api/health' };
    const res: MutableResponse = {};
    // Act
    const result = handler(req, res);
    // Assert
    expect(req.url).toBe('/health');
    expect(result).toBeDefined();
  });

  it('should default to / if url is missing', () => {
    const req: MutableRequest = {};
    const res: MutableResponse = {};
    const result = handler(req, res);
    expect(req.url).toBe('/');
    expect(result).toBeDefined();
  });
});
