/**
 * Foreground-only sync engine — pure class, no React dependency.
 *
 * Stores pending progress items in localStorage and syncs them to the
 * server via POST when the app is online. Designed for Transsion/low-end
 * devices where BackgroundSync is unreliable or killed by the OS.
 *
 * Constitution: NO BackgroundSync, NO periodicSync.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export interface PendingProgressItem {
  id: string;
  type: 'lesson_progress' | 'quiz_answer';
  payload: Record<string, unknown>;
  createdAt: string;
}

export type SyncEngineStatus = 'idle' | 'syncing' | 'pending' | 'error' | 'synced';

export interface SyncEngineOptions {
  /** Injectable fetch function for testing. Defaults to window.fetch. */
  fetchFn?: (url: string, init: RequestInit) => Promise<{ ok: boolean }>;
  /** Return current online status. Defaults to () => navigator.onLine. */
  getOnlineStatus?: () => boolean;
  /** Whether to bind to visibilitychange events. Default false. */
  listenVisibility?: boolean;
  /** localStorage key prefix. */
  storageKey?: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_STORAGE_KEY = 'sabificate:sync-queue';
const SYNC_ENDPOINT = '/api/v1/progress/sync';

// ── Engine ───────────────────────────────────────────────────────────────────

export class SyncEngine {
  private pending: PendingProgressItem[] = [];
  private status: SyncEngineStatus = 'idle';
  private fetchFn: (url: string, init: RequestInit) => Promise<{ ok: boolean }>;
  private getOnlineStatus: () => boolean;
  private storageKey: string;
  private visibilityHandler: (() => void) | null = null;

  constructor(opts: SyncEngineOptions = {}) {
    this.fetchFn = opts.fetchFn ?? ((url, init) => fetch(url, init));
    this.getOnlineStatus = opts.getOnlineStatus ?? (() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
    this.storageKey = opts.storageKey ?? DEFAULT_STORAGE_KEY;

    // Restore from localStorage
    this.loadFromStorage();

    // Update status based on restored items
    if (this.pending.length > 0) {
      this.status = 'pending';
    }

    // Optional: listen for visibility changes
    if (opts.listenVisibility) {
      this.visibilityHandler = () => {
        if (document.visibilityState === 'visible' && this.getOnlineStatus()) {
          void this.sync(true);
        }
      };
      document.addEventListener('visibilitychange', this.visibilityHandler);
    }
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /** Add a progress item to the pending queue. Persists to localStorage. */
  enqueue(item: PendingProgressItem): void {
    this.pending.push(item);
    this.status = 'pending';
    this.saveToStorage();
  }

  /** Get the number of items awaiting sync. */
  getPendingCount(): number {
    return this.pending.length;
  }

  /** Get a copy of all pending items. */
  getPendingItems(): PendingProgressItem[] {
    return [...this.pending];
  }

  /** Get current sync status. */
  getStatus(): SyncEngineStatus {
    return this.status;
  }

  /**
   * Attempt to sync pending items to the server.
   * @param isOnline — whether the device is currently online
   */
  async sync(isOnline: boolean): Promise<void> {
    if (!isOnline || this.pending.length === 0) {
      return;
    }

    this.status = 'syncing';

    try {
      const itemsToSync = [...this.pending];

      const response = await this.fetchFn(SYNC_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          items: itemsToSync.map((item) => ({
            type: item.type,
            payload: item.payload,
            created_at: item.createdAt,
          })),
        }),
      });

      if (response.ok) {
        // Remove synced items
        const syncedIds = new Set(itemsToSync.map((i) => i.id));
        this.pending = this.pending.filter((i) => !syncedIds.has(i.id));
        this.status = this.pending.length > 0 ? 'pending' : 'synced';
        this.saveToStorage();
      } else {
        this.status = 'error';
      }
    } catch {
      this.status = 'error';
    }
  }

  /** Returns false — this engine never uses BackgroundSync. */
  usesBackgroundSync(): boolean {
    return false;
  }

  /** Returns false — this engine never uses periodicSync. */
  usesPeriodicSync(): boolean {
    return false;
  }

  /** Clean up event listeners. */
  destroy(): void {
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }
  }

  // ── Storage helpers ───────────────────────────────────────────────────────

  private loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        this.pending = JSON.parse(raw) as PendingProgressItem[];
      }
    } catch {
      this.pending = [];
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.pending));
    } catch {
      // localStorage full or unavailable — degrade silently
    }
  }
}
