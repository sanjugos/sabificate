import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import {
  SyncEngine,
  type PendingProgressItem,
} from '../lib/sync/syncEngine';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makePendingItem(overrides: Partial<PendingProgressItem> = {}): PendingProgressItem {
  return {
    id: crypto.randomUUID(),
    type: 'lesson_progress',
    payload: { lessonId: 'L1', courseId: 'C1', progressPercent: 50 },
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('Offline Sync Engine — T-009', () => {
  let engine: SyncEngine;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    mockFetch = vi.fn();
    engine = new SyncEngine({ fetchFn: mockFetch });
  });

  afterEach(() => {
    engine.destroy();
  });

  // ── AC-6.1: Online sync sends POST with pending data ───────────────────

  describe('AC-6.1 — Online sync sends POST with pending progress data', () => {
    it('sends a POST request containing all pending items when online', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      const item = makePendingItem();
      engine.enqueue(item);

      // Simulate online
      await engine.sync(true);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toBe('/api/v1/progress/sync');
      expect(opts.method).toBe('POST');

      const body = JSON.parse(opts.body);
      expect(body.items).toHaveLength(1);
      expect(body.items[0].type).toBe('lesson_progress');
      expect(body.items[0].payload.lessonId).toBe('L1');
    });

    it('clears synced items from the pending queue on success', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      engine.enqueue(makePendingItem());
      engine.enqueue(makePendingItem({ type: 'quiz_answer' }));

      await engine.sync(true);

      expect(engine.getPendingCount()).toBe(0);
    });
  });

  // ── AC-6.2: Offline stores progress locally, no network call ───────────

  describe('AC-6.2 — Offline stores progress locally with no network call', () => {
    it('stores items in localStorage when offline and makes no fetch call', async () => {
      const item = makePendingItem();
      engine.enqueue(item);

      // Sync while offline — should skip network
      await engine.sync(false);

      expect(mockFetch).not.toHaveBeenCalled();
      expect(engine.getPendingCount()).toBe(1);

      // Verify persistence in localStorage
      const stored = engine.getPendingItems();
      expect(stored).toHaveLength(1);
      expect(stored[0].id).toBe(item.id);
    });
  });

  // ── AC-6.3: Offline-to-online transition fires sync with pending data ──

  describe('AC-6.3 — Transition from offline to online fires sync', () => {
    it('syncs all pending items when transitioning from offline to online', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      // Enqueue items while offline
      engine.enqueue(makePendingItem({ id: 'a1' }));
      engine.enqueue(makePendingItem({ id: 'a2' }));

      // Verify nothing sent while offline
      await engine.sync(false);
      expect(mockFetch).not.toHaveBeenCalled();
      expect(engine.getPendingCount()).toBe(2);

      // Now come online
      await engine.sync(true);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.items).toHaveLength(2);
      expect(engine.getPendingCount()).toBe(0);
    });
  });

  // ── AC-6.4: No BackgroundSync or periodicSync registrations ────────────

  describe('AC-6.4 — No BackgroundSync or periodicSync registrations', () => {
    it('does not register any BackgroundSync tag', () => {
      // The engine should have no reference to registration.sync.register
      expect(engine.usesBackgroundSync()).toBe(false);
    });

    it('does not register any periodicSync', () => {
      expect(engine.usesPeriodicSync()).toBe(false);
    });

    it('the engine source contains no sync.register or periodicSync.register calls', () => {
      // Verify the engine never calls the browser BackgroundSync/periodicSync APIs
      const engineSource = SyncEngine.toString();
      expect(engineSource).not.toContain('sync.register');
      expect(engineSource).not.toContain('periodicSync.register');
      expect(engineSource).not.toContain('registration.sync');
      expect(engineSource).not.toContain('registration.periodicSync');
    });
  });

  // ── Persistence: localStorage round-trip ───────────────────────────────

  describe('Persistence across engine restarts', () => {
    it('restores pending items from localStorage on construction', () => {
      const item = makePendingItem();
      engine.enqueue(item);
      expect(engine.getPendingCount()).toBe(1);

      // Destroy and recreate — should restore from localStorage
      engine.destroy();
      const engine2 = new SyncEngine({ fetchFn: mockFetch });
      expect(engine2.getPendingCount()).toBe(1);
      expect(engine2.getPendingItems()[0].id).toBe(item.id);
      engine2.destroy();
    });
  });

  // ── Visibility change triggers sync ────────────────────────────────────

  describe('Visibility change triggers sync', () => {
    it('triggers sync when document becomes visible while online', async () => {
      mockFetch.mockResolvedValue({ ok: true });

      // Create engine that listens to visibility
      const visEngine = new SyncEngine({
        fetchFn: mockFetch,
        getOnlineStatus: () => true,
        listenVisibility: true,
      });

      visEngine.enqueue(makePendingItem());
      expect(visEngine.getPendingCount()).toBe(1);

      // Simulate visibilitychange
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true,
        configurable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      // Wait for async sync to fire
      await vi.waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      visEngine.destroy();
    });
  });

  // ── Error handling: failed sync keeps items pending ────────────────────

  describe('Error handling', () => {
    it('keeps items pending when sync POST fails', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

      engine.enqueue(makePendingItem());
      await engine.sync(true);

      expect(engine.getPendingCount()).toBe(1);
      expect(engine.getStatus()).toBe('error');
    });

    it('keeps items pending when fetch throws', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      engine.enqueue(makePendingItem());
      await engine.sync(true);

      expect(engine.getPendingCount()).toBe(1);
      expect(engine.getStatus()).toBe('error');
    });
  });
});
