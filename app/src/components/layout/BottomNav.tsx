import { NavLink } from 'react-router-dom';

interface NavItem {
  to: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Home', icon: '⌂' },
  { to: '/courses', label: 'Courses', icon: '📖' },
  { to: '/credentials', label: 'Credentials', icon: '🎓' },
  { to: '/profile', label: 'Profile', icon: '👤' },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 safe-area-pb">
      <div className="flex justify-around items-stretch max-w-lg mx-auto">
        {NAV_ITEMS.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] py-2 px-1 text-xs transition-colors ${
                isActive
                  ? 'text-blue-700 font-semibold'
                  : 'text-gray-500 hover:text-gray-700'
              }`
            }
          >
            <span className="text-lg leading-none" aria-hidden="true">
              {icon}
            </span>
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
