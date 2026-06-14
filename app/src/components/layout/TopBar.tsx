import { DataSaverBadge } from './DataSaverBadge';
import { SyncStatus } from './SyncStatus';
import { useNetworkStatus } from '../../lib/network/useNetworkStatus';

export function TopBar() {
  const { isOnline } = useNetworkStatus();

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between bg-white border-b border-gray-200 px-4 h-14 min-h-[56px]">
      <h1 className="text-lg font-bold text-gray-900 tracking-tight">
        SABIficate
      </h1>
      <div className="flex items-center gap-3">
        <DataSaverBadge />
        <SyncStatus />
        {!isOnline && (
          <span
            className="inline-block h-2.5 w-2.5 rounded-full bg-red-500 shrink-0"
            title="Offline"
            aria-label="Offline"
          />
        )}
      </div>
    </header>
  );
}
