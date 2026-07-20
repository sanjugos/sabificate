import { Link } from 'react-router-dom';
import { DataSaverBadge } from './DataSaverBadge';
import { SyncStatus } from './SyncStatus';
import { useNetworkStatus } from '../../lib/network/useNetworkStatus';
import { useAuth } from '../../lib/auth/useAuth';

const STUDIO_ROLES = ['curriculum_author', 'platform_admin', 'sme_reviewer', 'corporate_admin', 'founder', 'admin'];

export function TopBar() {
  const { isOnline } = useNetworkStatus();
  const { user, isAuthenticated } = useAuth();
  const showStudio = isAuthenticated && user?.role && STUDIO_ROLES.includes(user.role);

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between bg-white border-b border-gray-200 px-4 h-14 min-h-[56px]">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-bold text-gray-900 tracking-tight">
          SABIficate
        </h1>
        {showStudio && (
          <Link
            to="/studio"
            className="text-xs font-medium text-blue-600 hover:text-blue-800 px-2 py-1 rounded-md hover:bg-blue-50 transition-colors"
          >
            Studio
          </Link>
        )}
      </div>
      <div className="flex items-center gap-3">
        {isAuthenticated && (
          <>
            <DataSaverBadge />
            <SyncStatus />
          </>
        )}
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
