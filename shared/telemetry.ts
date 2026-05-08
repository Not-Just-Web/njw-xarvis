/**
 * Basic telemetry tracking for NJW Xarvis
 * Tracks: provider usage, message counts, session metrics
 */

import type { ProviderId } from './provider-contract/types';

export type TelemetryEvent = {
  timestamp: number;
  eventType: TelemetryEventType;
  providerId?: ProviderId;
  sessionId?: string;
  metadata?: Record<string, any>;
};

export type TelemetryEventType =
  | 'provider_selected'
  | 'provider_added'
  | 'message_sent'
  | 'message_received'
  | 'session_created'
  | 'session_resumed'
  | 'context_captured'
  | 'auth_success'
  | 'auth_failed'
  | 'error_occurred';

export type TelemetryStats = {
  totalSessions: number;
  totalMessages: number;
  providerUsage: Record<ProviderId, number>;
  eventsPerDay: Record<string, number>;
  averageResponseTime: number;
  errorCount: number;
};

class Telemetry {
  private events: TelemetryEvent[] = [];
  private stats: TelemetryStats = {
    totalSessions: 0,
    totalMessages: 0,
    providerUsage: {},
    eventsPerDay: {},
    averageResponseTime: 0,
    errorCount: 0,
  };
  private storageKey = 'njw-xarvis-telemetry';
  private maxStoredEvents = 1000;

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Track a telemetry event
   */
  track(eventType: TelemetryEventType, providerId?: ProviderId, metadata?: Record<string, any>): void {
    const event: TelemetryEvent = {
      timestamp: Date.now(),
      eventType,
      providerId,
      metadata,
    };

    this.events.push(event);

    // Update stats
    this.updateStats(event);

    // Trim old events if storage gets too large
    if (this.events.length > this.maxStoredEvents) {
      this.events = this.events.slice(-this.maxStoredEvents);
    }

    this.saveToStorage();
    console.log(`[Telemetry] ${eventType}`, { providerId, metadata });
  }

  /**
   * Get telemetry stats
   */
  getStats(): TelemetryStats {
    return { ...this.stats };
  }

  /**
   * Get provider usage rank
   */
  getProviderRank(): Array<[ProviderId, number]> {
    return Object.entries(this.stats.providerUsage)
      .sort(([, a], [, b]) => b - a);
  }

  /**
   * Get events for a specific provider
   */
  getProviderEvents(providerId: ProviderId): TelemetryEvent[] {
    return this.events.filter(e => e.providerId === providerId);
  }

  /**
   * Get events from last N hours
   */
  getRecentEvents(hoursBack: number): TelemetryEvent[] {
    const cutoff = Date.now() - (hoursBack * 60 * 60 * 1000);
    return this.events.filter(e => e.timestamp > cutoff);
  }

  /**
   * Clear all telemetry data
   */
  clear(): void {
    this.events = [];
    this.stats = {
      totalSessions: 0,
      totalMessages: 0,
      providerUsage: {},
      eventsPerDay: {},
      averageResponseTime: 0,
      errorCount: 0,
    };
    chrome.storage.local.remove(this.storageKey);
  }

  /**
   * Export telemetry data as JSON (for debugging)
   */
  export(): string {
    return JSON.stringify({
      events: this.events,
      stats: this.stats,
      exportedAt: new Date().toISOString(),
    }, null, 2);
  }

  /**
   * Update stats based on event
   */
  private updateStats(event: TelemetryEvent): void {
    const dateKey = new Date(event.timestamp).toISOString().split('T')[0];

    // Track events per day
    this.stats.eventsPerDay[dateKey] = (this.stats.eventsPerDay[dateKey] || 0) + 1;

    // Track event-specific stats
    switch (event.eventType) {
      case 'session_created':
        this.stats.totalSessions++;
        break;

      case 'session_resumed':
        // Note: not counted as new session
        break;

      case 'message_sent':
        this.stats.totalMessages++;
        if (event.providerId) {
          this.stats.providerUsage[event.providerId] =
            (this.stats.providerUsage[event.providerId] || 0) + 1;
        }
        break;

      case 'message_received':
        if (event.metadata?.responseTimeMs) {
          this.updateAverageResponseTime(event.metadata.responseTimeMs);
        }
        break;

      case 'error_occurred':
        this.stats.errorCount++;
        break;

      default:
        break;
    }
  }

  /**
   * Update running average response time
   */
  private updateAverageResponseTime(newTime: number): void {
    const messageCount = this.stats.totalMessages;
    if (messageCount === 0) {
      this.stats.averageResponseTime = newTime;
    } else {
      // Running average: (old_avg * count + new_time) / (count + 1)
      this.stats.averageResponseTime =
        (this.stats.averageResponseTime * messageCount + newTime) / (messageCount + 1);
    }
  }

  /**
   * Load telemetry from storage
   */
  private loadFromStorage(): void {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get(this.storageKey, (result) => {
          if (result[this.storageKey]) {
            const data = result[this.storageKey];
            this.events = data.events || [];
            this.stats = data.stats || this.stats;
          }
        });
      }
    } catch (error) {
      console.warn('[Telemetry] Failed to load from storage:', error);
    }
  }

  /**
   * Save telemetry to storage
   */
  private saveToStorage(): void {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({
          [this.storageKey]: {
            events: this.events,
            stats: this.stats,
            savedAt: Date.now(),
          },
        });
      }
    } catch (error) {
      console.warn('[Telemetry] Failed to save to storage:', error);
    }
  }
}

// Singleton instance
export const telemetry = new Telemetry();
