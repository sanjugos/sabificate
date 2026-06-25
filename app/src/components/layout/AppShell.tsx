import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';
import { OfflineIndicator } from './OfflineIndicator';
import { useServiceWorker } from '../../lib/pwa/useServiceWorker';

interface AppShellProps {
  children?: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { needsUpdate, applyUpdate } = useServiceWorker();

  return (
    <div className="flex flex-col min-h-svh min-w-[360px]">
      <TopBar />
      <OfflineIndicator />
      {needsUpdate && (
        <div className="flex items-center justify-between bg-blue-600 px-4 py-2 text-sm text-white">
          <span>A new version is available.</span>
          <button
            onClick={applyUpdate}
            className="rounded bg-white px-3 py-1 text-xs font-semibold text-blue-700"
          >
            Update now
          </button>
        </div>
      )}
      <main className="flex-1 pb-16 overflow-y-auto">
        {children ?? <Outlet />}
      </main>
      <BottomNav />
    </div>
  );
}
