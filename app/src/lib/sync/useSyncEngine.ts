import { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../progress/db';
import type { SyncQueueRecord } from '../progress/db';

// ── Types ─────────────────────────────────────────────────────────────────

export type SyncStatus = 'synced' | 'syncing' | 'pending' | 'error';

export interface SyncState {
  status: SyncStatus;
  pendingCount: number;
  lastSyncAt: Date | null;
  error: string | null;
}

export interface UseSyncEngineReturn extends SyncState {
  triggerSync: () => Promise<void>;
}

// ── Sync endpoint ─────────────────────────────────────────────────────────

const SYNC_ENDPOINT = '/api/v1/progress/sync';
const BATCH_SIZE = 20;

async function postSyncBatch(items: SyncQueueRecord[]): Promise<boolean> {
  try {
    const res = await fetch(SYNC_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        items: items.map((item) => ({
          type: item.type,
          payload: JSON.parse(item.payload),
          created_at: item.createdAt,
        })),
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────

/**
 * Foreground-first sync engine.
 *
 * Does NOT depend on Background Sync API (Transsion devices kill it).
 * Instead, syncs happen:
 * 1. On app foreground (visibilitychange to 'visible')
 * 2. On explicit triggerSync() calls
 * 3. After each save-to-Dexie operation (via external triggerSync call)
 *
 * Items are always written to IndexedDB first, then synced to server second.
 */
export function useSyncEngine(): UseSyncEngineReturn {
  const [state, setState] = useState<SyncState>({
    status: 'synced',
    pendingCount: 0,
    lastSyncAt: null,
    error: null,
  });

  const isSyncingRef = useRef(false);

  // Count pending items
  const refreshPendingCount = useCallback(async () => {
    try {
      const count = await db.syncQueue.where('synced').equals(0).count();
      setState((prev) => ({
        ...prev,
        pendingCount: count,
        status: count > 0 && prev.status === 'synced' ? 'pending' : prev.status,
      }));
      return count;
    } catch {
      return 0;
    }
  }, []);

  // Core sync logic
  const triggerSync = useCallback(async () => {
    // Prevent concurrent syncs
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;

    try {
      const pending = await db.syncQueue
        .where('synced')
        .equals(0)
        .limit(BATCH_SIZE)
        .toArray();

      if (pending.length === 0) {
        setState((prev) => ({
          ...prev,
          status: 'synced',
          pendingCount: 0,
          error: null,
        }));
        isSyncingRef.current = false;
        return;
      }

      setState((prev) => ({
        ...prev,
        status: 'syncing',
        error: null,
      }));

      const success = await postSyncBatch(pending);

      if (success) {
        // Mark items as synced in Dexie
        const ids = pending.map((item) => item.id).filter((id): id is number => id !== undefined);
        await db.syncQueue.where('id').anyOf(ids).modify({ synced: 1 });

        const now = new Date();

        // Check if there are more pending items
        const remainingCount = await db.syncQueue.where('synced').equals(0).count();

        setState({
          status: remainingCount > 0 ? 'pending' : 'synced',
          pendingCount: remainingCount,
          lastSyncAt: now,
          error: null,
        });

        // If there are more items, sync the next batch
        if (remainingCount > 0) {
          isSyncingRef.current = false;
          // Use setTimeout to avoid stack overflow with large queues
          setTimeout(() => void triggerSync(), 100);
          return;
        }
      } else {
        // Sync failed — keep items in queue
        const count = await db.syncQueue.where('synced').equals(0).count();
        setState({
          status: 'error',
          pendingCount: count,
          lastSyncAt: state.lastSyncAt,
          error: `${count} item${count !== 1 ? 's' : ''} waiting to sync`,
        });
      }
    } catch {
      const count = await refreshPendingCount();
      setState((prev) => ({
        ...prev,
        status: 'error',
        pendingCount: count,
        error: 'Sync failed. Will retry when online.',
      }));
    } finally {
      isSyncingRef.current = false;
    }
  }, [state.lastSyncAt, refreshPendingCount]);

  // Sync on app foreground (visibilitychange)
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        void triggerSync();
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [triggerSync]);

  // Initial sync + pending count on mount
  useEffect(() => {
    void refreshPendingCount().then((count) => {
      if (count > 0) {
        void triggerSync();
      }
    });
  }, [refreshPendingCount, triggerSync]);

  return {
    ...state,
    triggerSync,
  };
}
