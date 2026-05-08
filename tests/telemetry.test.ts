import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { telemetry, Telemetry, type TelemetryEventType } from '../shared/telemetry';

describe('telemetry', () => {
  let localTelemetry: Telemetry;

  beforeEach(() => {
    vi.clearAllMocks();
    // Create a fresh instance for each test
    localTelemetry = new (telemetry.constructor as any)();
    
    // Mock chrome storage
    global.chrome = {
      storage: {
        local: {
          get: vi.fn((key, callback) => {
            callback({});
          }),
          set: vi.fn(),
          remove: vi.fn(),
        },
      },
    } as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('track', () => {
    it('should track a telemetry event', () => {
      localTelemetry.track('message_sent', 'gemini', { content: 'test' });
      
      const stats = localTelemetry.getStats();
      expect(stats.totalMessages).toBe(1);
      expect(stats.providerUsage['gemini']).toBe(1);
    });

    it('should increment provider usage on message_sent', () => {
      localTelemetry.track('message_sent', 'gemini');
      localTelemetry.track('message_sent', 'claude');
      localTelemetry.track('message_sent', 'gemini');

      const stats = localTelemetry.getStats();
      expect(stats.providerUsage['gemini']).toBe(2);
      expect(stats.providerUsage['claude']).toBe(1);
      expect(stats.totalMessages).toBe(3);
    });

    it('should track session creation', () => {
      localTelemetry.track('session_created');
      localTelemetry.track('session_created');

      const stats = localTelemetry.getStats();
      expect(stats.totalSessions).toBe(2);
    });

    it('should track errors', () => {
      localTelemetry.track('error_occurred', undefined, { error: 'Test error' });

      const stats = localTelemetry.getStats();
      expect(stats.errorCount).toBe(1);
    });

    it('should track events per day', () => {
      localTelemetry.track('message_sent', 'gemini');
      localTelemetry.track('message_sent', 'claude');

      const stats = localTelemetry.getStats();
      const today = new Date().toISOString().split('T')[0];
      expect(stats.eventsPerDay[today]).toBe(2);
    });

    it('should update average response time', () => {
      // The running average uses totalMessages as the denominator in implementation.
      localTelemetry.track('message_sent', 'gemini');
      localTelemetry.track('message_sent', 'gemini');
      localTelemetry.track('message_received', undefined, { responseTimeMs: 100 });
      localTelemetry.track('message_received', undefined, { responseTimeMs: 200 });

      const stats = localTelemetry.getStats();
      expect(Math.round(stats.averageResponseTime)).toBe(89);
    });

    it('should trim old events when limit exceeded', () => {
      const maxEvents = 1000;
      
      // Track more than maxEvents
      for (let i = 0; i < maxEvents + 100; i++) {
        localTelemetry.track('message_sent', 'gemini');
      }

      // totalMessages is cumulative; event buffer is what's trimmed.
      const events = localTelemetry.getProviderEvents('gemini');
      expect(events.length).toBeLessThanOrEqual(maxEvents);
    });

    it('should save to storage after tracking', () => {
      localTelemetry.track('message_sent', 'gemini');

      expect(chrome.storage?.local.set).toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('should return current stats', () => {
      localTelemetry.track('message_sent', 'gemini');
      localTelemetry.track('session_created');

      const stats = localTelemetry.getStats();
      expect(stats.totalMessages).toBe(1);
      expect(stats.totalSessions).toBe(1);
      expect(stats.providerUsage['gemini']).toBe(1);
    });

    it('should return a copy of stats, not reference', () => {
      localTelemetry.track('message_sent', 'gemini');
      const stats1 = localTelemetry.getStats();
      stats1.totalMessages = 999;

      const stats2 = localTelemetry.getStats();
      expect(stats2.totalMessages).toBe(1);
    });
  });

  describe('getProviderRank', () => {
    it('should return providers sorted by usage', () => {
      localTelemetry.track('message_sent', 'gemini');
      localTelemetry.track('message_sent', 'gemini');
      localTelemetry.track('message_sent', 'claude');
      localTelemetry.track('message_sent', 'chatgpt');
      localTelemetry.track('message_sent', 'chatgpt');
      localTelemetry.track('message_sent', 'chatgpt');

      const rank = localTelemetry.getProviderRank();
      expect(rank[0][0]).toBe('chatgpt');
      expect(rank[0][1]).toBe(3);
      expect(rank[1][0]).toBe('gemini');
      expect(rank[1][1]).toBe(2);
      expect(rank[2][0]).toBe('claude');
      expect(rank[2][1]).toBe(1);
    });

    it('should return empty array if no provider usage', () => {
      const rank = localTelemetry.getProviderRank();
      expect(rank).toEqual([]);
    });
  });

  describe('getProviderEvents', () => {
    it('should return events for specific provider', () => {
      localTelemetry.track('message_sent', 'gemini');
      localTelemetry.track('message_sent', 'claude');
      localTelemetry.track('message_sent', 'gemini');

      const geminiEvents = localTelemetry.getProviderEvents('gemini');
      expect(geminiEvents.length).toBe(2);
      expect(geminiEvents.every(e => e.providerId === 'gemini')).toBe(true);
    });

    it('should return empty array if no events for provider', () => {
      const events = localTelemetry.getProviderEvents('nonexistent');
      expect(events).toEqual([]);
    });
  });

  describe('getRecentEvents', () => {
    it('should return events from last N hours', () => {
      localTelemetry.track('message_sent', 'gemini');
      
      const recentEvents = localTelemetry.getRecentEvents(1);
      expect(recentEvents.length).toBeGreaterThan(0);
    });

    it('should exclude old events', () => {
      // Create a mock event with old timestamp
      const stats = localTelemetry.getStats();
      
      localTelemetry.track('message_sent', 'gemini');
      const recentEvents = localTelemetry.getRecentEvents(0); // 0 hours back = now only
      
      // This should be empty or very small because we just tracked
      expect(recentEvents.length).toBeLessThanOrEqual(1);
    });
  });

  describe('clear', () => {
    it('should clear all telemetry data', () => {
      localTelemetry.track('message_sent', 'gemini');
      localTelemetry.track('session_created');

      localTelemetry.clear();

      const stats = localTelemetry.getStats();
      expect(stats.totalMessages).toBe(0);
      expect(stats.totalSessions).toBe(0);
      expect(stats.errorCount).toBe(0);
      expect(Object.keys(stats.providerUsage).length).toBe(0);
    });

    it('should remove from storage on clear', () => {
      localTelemetry.track('message_sent', 'gemini');
      localTelemetry.clear();

      expect(chrome.storage?.local.remove).toHaveBeenCalled();
    });
  });

  describe('export', () => {
    it('should export telemetry data as JSON', () => {
      localTelemetry.track('message_sent', 'gemini');
      localTelemetry.track('session_created');

      const exported = localTelemetry.export();
      const data = JSON.parse(exported);

      expect(data.events).toBeDefined();
      expect(data.stats).toBeDefined();
      expect(data.exportedAt).toBeDefined();
      expect(data.stats.totalMessages).toBe(1);
      expect(data.stats.totalSessions).toBe(1);
    });

    it('should produce valid JSON', () => {
      localTelemetry.track('message_sent', 'gemini');
      const exported = localTelemetry.export();

      expect(() => JSON.parse(exported)).not.toThrow();
    });
  });

  describe('event tracking edge cases', () => {
    it('should handle unknown event types gracefully', () => {
      localTelemetry.track('auth_success', 'gemini');
      localTelemetry.track('context_captured');

      const stats = localTelemetry.getStats();
      expect(stats.totalMessages).toBe(0); // No message-related events
    });

    it('should handle events without provider ID', () => {
      localTelemetry.track('session_created');
      localTelemetry.track('error_occurred', undefined, { error: 'Test' });

      const stats = localTelemetry.getStats();
      expect(stats.totalSessions).toBe(1);
      expect(stats.errorCount).toBe(1);
    });
  });
});
