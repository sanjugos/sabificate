import { useSyncStatus } from '../../lib/sync/SyncContext';
import type { SyncStatus as SyncState } from '../../lib/sync/useSyncEngine';

const SYNC_LABELS: Record<SyncState, string> = {
  synced: 'Synced',
  syncing: 'Syncing...',
  pending: 'Pending',
  error: 'Sync Error',
};

const SYNC_COLORS: Record<SyncState, string> = {
  synced: 'text-green-600',
  syncing: 'text-blue-600',
  pending: 'text-amber-600',
  error: 'text-red-600',
};

export function SyncStatus() {
  const { status: state } = useSyncStatus();

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${SYNC_COLORS[state]}`}
    >
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${
          state === 'synced' ? 'bg-green-500' : 'bg-current'
        }`}
        aria-hidden="true"
      />
      {SYNC_LABELS[state]}
    </span>
  );
}
