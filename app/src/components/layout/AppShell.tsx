import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';
import { OfflineIndicator } from './OfflineIndicator';

interface AppShellProps {
  children?: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex flex-col min-h-svh min-w-[360px]">
      <TopBar />
      <OfflineIndicator />
      <main className="flex-1 pb-16 overflow-y-auto">
        {children ?? <Outlet />}
      </main>
      <BottomNav />
    </div>
  );
}
