import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';
import { LayoutDashboard, Building2, Users, FileText, Kanban, LogOut, ChevronRight, Home } from 'lucide-react';
import { cn } from '../lib/utils';
import { getCompany } from '../lib/store';

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/companies', icon: Building2, label: 'Companies' },
  { to: '/contacts', icon: Users, label: 'Contacts' },
  { to: '/dossiers', icon: FileText, label: 'Dossiers' },
  { to: '/pipeline', icon: Kanban, label: 'Pipeline' },
];

function Breadcrumbs() {
  const location = useLocation();
  const parts = location.pathname.split('/').filter(Boolean);
  // Track where user came from for back navigation
  const referrer = location.state?.from;

  if (parts.length === 0) return null;

  const crumbs = [{ label: 'Home', to: '/' }];

  if (parts[0] === 'companies') {
    if (parts[1]) {
      // Company detail — show where user came from
      if (referrer === 'dossiers') {
        crumbs.push({ label: 'Dossiers', to: '/dossiers' });
      } else if (referrer === 'contacts') {
        crumbs.push({ label: 'Contacts', to: '/contacts' });
      } else if (referrer === 'pipeline') {
        crumbs.push({ label: 'Pipeline', to: '/pipeline' });
      } else {
        crumbs.push({ label: 'Companies', to: '/companies' });
      }
      const company = getCompany(parts[1]);
      crumbs.push({ label: company?.name || parts[1], to: null });
    } else {
      crumbs.push({ label: 'Companies', to: null });
    }
  } else if (parts[0] === 'contacts') {
    crumbs.push({ label: 'Contacts', to: null });
  } else if (parts[0] === 'dossiers') {
    crumbs.push({ label: 'Dossiers', to: null });
  } else if (parts[0] === 'pipeline') {
    crumbs.push({ label: 'Pipeline', to: null });
  }

  return (
    <div className="flex items-center gap-1.5 px-6 py-2 bg-white border-b text-xs text-gray-500">
      {crumbs.map((c, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight size={12} className="text-gray-300" />}
          {c.to ? (
            <Link to={c.to} className="hover:text-brand-700 transition-colors">
              {i === 0 ? <Home size={12} /> : c.label}
            </Link>
          ) : (
            <span className="text-gray-700 font-medium">{c.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}

export default function Layout({ onLogout }) {
  return (
    <div className="flex h-screen">
      <aside className="w-56 bg-brand-900 text-white flex flex-col shrink-0">
        <div className="p-4 border-b border-brand-800">
          <h1 className="text-lg font-bold tracking-tight">Gbitse CRM</h1>
          <p className="text-xs text-brand-200 mt-0.5">Nigeria HR/OD Intelligence</p>
        </div>
        <nav className="flex-1 py-3 space-y-0.5 px-2">
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} end={n.to === '/'}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive ? 'bg-brand-700 text-white' : 'text-brand-200 hover:bg-brand-800 hover:text-white'
              )}>
              <n.icon size={18} />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-brand-800">
          <button onClick={onLogout} className="flex items-center gap-2 text-brand-300 hover:text-white text-sm w-full px-3 py-2 rounded-lg hover:bg-brand-800 transition-colors">
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto bg-gray-50 flex flex-col">
        <Breadcrumbs />
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
