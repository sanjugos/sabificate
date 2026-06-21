import { Link } from 'react-router-dom';

interface DegradedAccessBannerProps {
  daysRemaining: number;
}

/**
 * Amber/yellow banner shown when a user's subscription has expired
 * but they are still within the grace period.
 */
export function DegradedAccessBanner({ daysRemaining }: DegradedAccessBannerProps) {
  return (
    <div className="bg-amber-50 border-l-4 border-amber-400 px-4 py-3 mb-4" role="alert">
      <div className="flex items-start gap-3">
        <svg
          className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
        <div className="flex-1">
          <p className="text-sm font-medium text-amber-800">
            Your subscription has expired. You have{' '}
            <span className="font-bold">
              {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}
            </span>{' '}
            remaining to renew before content access is restricted.
          </p>
          <Link
            to="/pricing"
            className="mt-2 inline-block text-sm font-semibold text-amber-700 underline hover:text-amber-900"
          >
            Renew subscription
          </Link>
        </div>
      </div>
    </div>
  );
}
