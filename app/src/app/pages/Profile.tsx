import { useRef, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/auth/useAuth';
import { useDataSaverMode } from '../../lib/pwa/useDataSaverMode';
import type { DataSaverMode } from '../../../contracts/types';

const DATA_SAVER_OPTIONS: { value: DataSaverMode; label: string; desc: string }[] = [
  { value: 'full', label: 'Full Quality', desc: 'All images, videos, and rich content' },
  { value: 'data_saver', label: 'Data Saver', desc: 'Compressed images, no autoplay' },
  { value: 'ultra_light', label: 'Ultra Light', desc: 'Text only, minimal data usage' },
];

export default function Profile() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { mode, setMode } = useDataSaverMode();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    function handleClick(e: MouseEvent) {
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-mode]');
      if (btn) {
        flushSync(() => { setMode(btn.getAttribute('data-mode') as DataSaverMode); });
        return;
      }
      const logoutBtn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-action="logout"]');
      if (logoutBtn) { logout(); }
    }
    el.addEventListener('click', handleClick);
    return () => el.removeEventListener('click', handleClick);
  }, [setMode, logout]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500 mb-4">Sign in to view your profile</p>
        <Link to="/login" className="text-blue-700 font-medium">Sign In</Link>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="p-4 space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-700">
          {user?.first_name?.[0]}{user?.last_name?.[0]}
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">{user?.first_name} {user?.last_name}</h1>
          <p className="text-sm text-gray-500">{user?.email}</p>
          <span className="inline-block mt-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 capitalize">
            {user?.role?.replace('_', ' ')}
          </span>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Data Usage Mode</h2>
        <div className="space-y-2">
          {DATA_SAVER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              data-mode={opt.value}
              type="button"
              onClick={() => setMode(opt.value)}
              className={`w-full rounded-lg border p-3 text-left transition-colors ${
                mode === opt.value
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 active:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm text-gray-900">{opt.label}</span>
                {mode === opt.value && <span className="text-blue-600 text-sm">Active</span>}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Account</h2>
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
            <span className="text-sm text-gray-700">Language</span>
            <span className="text-sm text-gray-500">{user?.language_preference === 'en' ? 'English' : user?.language_preference}</span>
          </div>
          {user?.org_id && (
            <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
              <span className="text-sm text-gray-700">Organization</span>
              <span className="text-sm text-gray-500">Linked</span>
            </div>
          )}
        </div>
      </div>

      <button
        data-action="logout"
        type="button"
        onClick={() => logout()}
        className="w-full rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 active:bg-red-100"
      >
        Sign Out
      </button>
    </div>
  );
}
