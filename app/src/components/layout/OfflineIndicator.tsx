import { useNetworkStatus } from '../../lib/network/useNetworkStatus';

export function OfflineIndicator() {
  const { isOnline } = useNetworkStatus();

  if (isOnline) return null;

  return (
    <div
      role="alert"
      className="bg-amber-400 text-amber-900 text-center text-sm font-medium px-4 py-2"
    >
      You are offline. Some features may be unavailable.
    </div>
  );
}
