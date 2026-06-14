import { createContext, useContext, type ReactNode } from 'react';
import { useSyncEngine, type SyncStatus } from './useSyncEngine';

// ── Context type ──────────────────────────────────────────────────────────

interface SyncContextValue {
  status: SyncStatus;
  pendingCount: number;
  lastSyncAt: Date | null;
  triggerSync: () => Promise<void>;
}

const SyncContext = createContext<SyncContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────

export function SyncProvider({ children }: { children: ReactNode }) {
  const engine = useSyncEngine();

  const value: SyncContextValue = {
    status: engine.status,
    pendingCount: engine.pendingCount,
    lastSyncAt: engine.lastSyncAt,
    triggerSync: engine.triggerSync,
  };

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

// ── Hook ──────────────────────────────────────────────────────────────────

export function useSyncStatus(): SyncContextValue {
  const ctx = useContext(SyncContext);
  if (!ctx) {
    throw new Error('useSyncStatus must be used within a SyncProvider');
  }
  return ctx;
}
