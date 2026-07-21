import { useState } from 'react';
import { Link } from 'react-router-dom';

interface AccountInfo {
  email: string;
  password: string;
  role: string;
  description: string;
  access: string[];
}

const TEST_ACCOUNTS: AccountInfo[] = [
  {
    email: 'demo@sabificate.com',
    password: 'demo1234',
    role: 'Learner',
    description: 'Standard learner account for testing the core learning experience.',
    access: ['Dashboard', 'Course Catalog', 'Lesson Player', 'Credentials', 'Profile', 'Pricing'],
  },
  {
    email: 'admin@firstbank-training.ng',
    password: 'admin1234',
    role: 'Corporate Admin',
    description: 'Organization administrator with team oversight and analytics.',
    access: ['Dashboard', 'Admin Panel', 'Curriculum Studio', 'Concept Catalog', 'Course Catalog'],
  },
  {
    email: 'platform@sabificate.com',
    password: 'staff1234',
    role: 'Platform Admin',
    description: 'Full platform administrator with access to all features.',
    access: ['Dashboard', 'Admin Panel', 'Curriculum Studio', 'Concept Catalog', 'Course Catalog'],
  },
  {
    email: 'author@sabificate.com',
    password: 'staff1234',
    role: 'Curriculum Author',
    description: 'Content creator responsible for building and editing courses.',
    access: ['Dashboard', 'Curriculum Studio', 'Concept Catalog', 'Course Catalog'],
  },
  {
    email: 'reviewer@sabificate.com',
    password: 'staff1234',
    role: 'SME Reviewer',
    description: 'Subject matter expert who reviews and approves course content.',
    access: ['Dashboard', 'Curriculum Studio', 'Course Catalog'],
  },
];

interface TestScenario {
  title: string;
  role: string;
  steps: string[];
  expected: string;
}

const TEST_SCENARIOS: TestScenario[] = [
  {
    title: 'Complete a lesson',
    role: 'Learner',
    steps: [
      'Log in as demo@sabificate.com',
      'Go to Course Catalog and pick any course',
      'Enroll, then open the first lesson',
      'Navigate through all cards using Next/Previous or swipe',
      'Answer quiz questions when they appear',
      'Reach the final card',
    ],
    expected: 'Progress bar fills to 100%. Dashboard shows updated completion percentage.',
  },
  {
    title: 'Browse and filter courses',
    role: 'Learner',
    steps: [
      'Go to Course Catalog (bottom nav: Courses)',
      'Type a keyword in the search bar',
      'Filter by category using the dropdown',
      'Filter by difficulty level',
      'Navigate between pages if more than 12 results',
    ],
    expected: 'Filters show correct counts. Results update instantly. Pagination works correctly.',
  },
  {
    title: 'View credentials',
    role: 'Learner',
    steps: [
      'Complete at least one course fully',
      'Go to Credentials (bottom nav)',
      'View earned badges and certificates',
    ],
    expected: 'Completed courses appear with credential details. Verification links work.',
  },
  {
    title: 'Admin analytics dashboard',
    role: 'Corporate Admin / Platform Admin',
    steps: [
      'Log in as admin@firstbank-training.ng or platform@sabificate.com',
      'Navigate to /admin',
      'Review overview statistics',
      'Check learner list and course completion stats',
      'Use pagination on data tables',
    ],
    expected: 'Corporate admin sees org-scoped data. Platform admin sees platform-wide data.',
  },
  {
    title: 'Curriculum Studio',
    role: 'Curriculum Author',
    steps: [
      'Log in as author@sabificate.com',
      'Click "Studio" link in the top bar',
      'Browse existing course content',
      'Review module and lesson structure',
    ],
    expected: 'Studio link is visible in top bar. Course content structure is browsable.',
  },
  {
    title: 'Onboarding flow',
    role: 'New Learner',
    steps: [
      'Register a new account at /register',
      'Complete the persona onboarding questionnaire',
      'Select professional background and learning goals',
    ],
    expected: 'New user is redirected to onboarding. After completing, lands on Dashboard with personalized difficulty tier.',
  },
  {
    title: 'Mobile responsiveness',
    role: 'Any',
    steps: [
      'Open the site on a mobile device or resize browser to 390px width',
      'Navigate through all main pages',
      'Check that all buttons are at least 44px touch targets',
      'Test swipe navigation in the Lesson Player',
      'Verify no horizontal overflow or text truncation issues',
    ],
    expected: 'All pages render cleanly at 390px. No horizontal scroll. Touch targets are accessible.',
  },
  {
    title: 'Offline and PWA behavior',
    role: 'Any',
    steps: [
      'Open the site and let it fully load',
      'Toggle airplane mode or disconnect network',
      'Navigate between cached pages',
      'Reconnect and verify data syncs',
    ],
    expected: 'Offline indicator appears. Cached pages remain accessible. Sync status updates on reconnect.',
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleCopy}
      className="ml-2 px-2 py-0.5 text-xs rounded border border-gray-300 text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors"
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function AccountCard({ account }: { account: AccountInfo }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="rounded-lg border border-gray-200 p-4 bg-white">
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-gray-900 text-sm">{account.role}</h3>
        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
          {account.role}
        </span>
      </div>
      <p className="text-xs text-gray-500 mb-3">{account.description}</p>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-500 w-16 shrink-0">Email</span>
          <code className="bg-gray-50 px-2 py-0.5 rounded text-xs font-mono text-gray-800 min-w-0 truncate">
            {account.email}
          </code>
          <CopyButton text={account.email} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500 w-16 shrink-0">Pass</span>
          <code className="bg-gray-50 px-2 py-0.5 rounded text-xs font-mono text-gray-800">
            {showPassword ? account.password : '••••••••'}
          </code>
          <button
            onClick={() => setShowPassword(!showPassword)}
            className="px-2 py-0.5 text-xs rounded border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
          {showPassword && <CopyButton text={account.password} />}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-500 mb-1">Accessible pages</p>
        <div className="flex flex-wrap gap-1">
          {account.access.map((page) => (
            <span
              key={page}
              className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600"
            >
              {page}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ScenarioCard({ scenario, index }: { scenario: TestScenario; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold shrink-0">
            {index + 1}
          </span>
          <div className="min-w-0">
            <h3 className="font-medium text-gray-900 text-sm truncate">
              {scenario.title}
            </h3>
            <span className="text-xs text-gray-500">{scenario.role}</span>
          </div>
        </div>
        <span className="text-gray-400 shrink-0 ml-2">
          {expanded ? '−' : '+'}
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <div className="mt-3">
            <p className="text-xs font-semibold text-gray-700 mb-2">Steps</p>
            <ol className="space-y-1.5 ml-4">
              {scenario.steps.map((step, i) => (
                <li
                  key={i}
                  className="text-sm text-gray-700 list-decimal pl-1"
                >
                  {step}
                </li>
              ))}
            </ol>
          </div>
          <div className="mt-3 p-3 rounded bg-green-50 border border-green-200">
            <p className="text-xs font-semibold text-green-800 mb-1">
              Expected result
            </p>
            <p className="text-sm text-green-700">{scenario.expected}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TeamGuide() {
  const [activeTab, setActiveTab] = useState<'overview' | 'accounts' | 'testing' | 'pages'>('overview');

  const tabs = [
    { key: 'overview' as const, label: 'Overview' },
    { key: 'accounts' as const, label: 'Test Accounts' },
    { key: 'pages' as const, label: 'Pages' },
    { key: 'testing' as const, label: 'Test Scenarios' },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
            Internal
          </span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Team Guide</h1>
        <p className="text-sm text-gray-500 mt-1">
          Usage guide and testing reference for the SABIficate platform.
        </p>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 mb-6 overflow-x-auto border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              What is SABIficate?
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              SABIficate is a professional microlearning platform built for
              Nigerian working professionals. It delivers bite-sized compliance
              and professional development courses through a mobile-first
              progressive web app (PWA).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Key features
            </h2>
            <div className="grid gap-3">
              {[
                {
                  title: 'Course Catalog',
                  detail: '238 courses across compliance, banking, professional development, and more. Searchable and filterable by category and difficulty.',
                },
                {
                  title: 'Card-based Lesson Player',
                  detail: 'Lessons are broken into cards — text, quizzes, scenarios, and artifacts. Navigate with buttons, dot indicators, or swipe gestures.',
                },
                {
                  title: 'Adaptive Difficulty',
                  detail: 'Three tiers: Foundational, Working, and Applied. Content adapts based on learner persona. Users can override in the lesson player.',
                },
                {
                  title: 'Credentials and Badges',
                  detail: 'Earned on course completion. Publicly verifiable via unique links.',
                },
                {
                  title: 'Admin Dashboard',
                  detail: 'Analytics for corporate admins (org-scoped) and platform admins (platform-wide). Learner progress, course stats, and overview metrics.',
                },
                {
                  title: 'Curriculum Studio',
                  detail: 'Content management for authors and reviewers. Browse and manage course modules and lessons.',
                },
                {
                  title: 'PWA with Offline Support',
                  detail: 'Installable as an app. Works offline with service worker caching. Data saver mode for low-bandwidth environments.',
                },
                {
                  title: 'Subscription and Payments',
                  detail: 'Paystack-integrated billing in NGN. Free, Professional, and Annual plans for individuals. B2B plans for organizations.',
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-lg border border-gray-200 p-3 bg-white"
                >
                  <h3 className="font-medium text-gray-900 text-sm">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">{feature.detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              User roles
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 pr-4 font-semibold text-gray-900">
                      Role
                    </th>
                    <th className="text-left py-2 font-semibold text-gray-900">
                      Purpose
                    </th>
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  <tr className="border-b border-gray-100">
                    <td className="py-2 pr-4 font-medium">Learner</td>
                    <td className="py-2">Takes courses, earns credentials, tracks progress</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 pr-4 font-medium">Corporate Admin</td>
                    <td className="py-2">Manages org learners, views org-scoped analytics</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 pr-4 font-medium">Platform Admin</td>
                    <td className="py-2">Full platform access, platform-wide analytics</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 pr-4 font-medium">Curriculum Author</td>
                    <td className="py-2">Creates and edits course content via Studio</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-medium">SME Reviewer</td>
                    <td className="py-2">Reviews and approves course content</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* Test Accounts */}
      {activeTab === 'accounts' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500 mb-4">
            Use these accounts to test different user experiences and role-based access.
          </p>
          {TEST_ACCOUNTS.map((account) => (
            <AccountCard key={account.email} account={account} />
          ))}
        </div>
      )}

      {/* Pages */}
      {activeTab === 'pages' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500 mb-4">
            All routes and what to expect on each page.
          </p>

          {[
            {
              path: '/',
              name: 'Dashboard',
              roles: 'All authenticated users',
              detail: 'Shows enrolled courses with progress bars, completion stats, and quick links. New learners without a persona are redirected to onboarding.',
            },
            {
              path: '/courses',
              name: 'Course Catalog',
              roles: 'All users (public)',
              detail: 'Browse all 238 courses. Search by keyword, filter by category or difficulty. 12 courses per page with pagination.',
            },
            {
              path: '/courses/:slug',
              name: 'Course Detail',
              roles: 'All users (public)',
              detail: 'Course overview with description, module/lesson structure, CPD hours, and enrollment CTA. Accordion-style module navigation.',
            },
            {
              path: '/courses/:slug/lessons/:id',
              name: 'Lesson Player',
              roles: 'Enrolled learners',
              detail: 'Card-based lesson with progress bar, difficulty selector, dot navigation, swipe support. Blocks: text, quiz, scenario, artifact. Sequential unlock.',
            },
            {
              path: '/credentials',
              name: 'Credentials',
              roles: 'Authenticated users',
              detail: 'Earned badges and certificates. Each credential has a public verification link.',
            },
            {
              path: '/profile',
              name: 'Profile',
              roles: 'Authenticated users',
              detail: 'User profile and settings.',
            },
            {
              path: '/pricing',
              name: 'Pricing',
              roles: 'All users (public)',
              detail: 'Individual plans (Free, Professional, Annual) with Paystack checkout. B2B enterprise plans with contact sales CTA.',
            },
            {
              path: '/admin',
              name: 'Admin Dashboard',
              roles: 'Corporate Admin, Platform Admin',
              detail: 'Analytics with overview stats, learner list, and course completion data. Corporate admins see org-scoped data only.',
            },
            {
              path: '/studio',
              name: 'Curriculum Studio',
              roles: 'Author, Reviewer, Corp Admin, Platform Admin',
              detail: 'Content management for course modules and lessons.',
            },
            {
              path: '/catalog',
              name: 'Concept Catalog',
              roles: 'Author, Corp Admin, Platform Admin',
              detail: 'Reusable concept library for curriculum development.',
            },
            {
              path: '/onboarding',
              name: 'Onboarding',
              roles: 'New learners',
              detail: 'Persona questionnaire to set difficulty tier and learning preferences. Only shown once after registration.',
            },
            {
              path: '/login',
              name: 'Login',
              roles: 'Public',
              detail: 'Email and password authentication. Supports redirect parameter for post-login navigation.',
            },
            {
              path: '/register',
              name: 'Register',
              roles: 'Public',
              detail: 'New account creation with name, email, password.',
            },
            {
              path: '/verify/:id',
              name: 'Public Verification',
              roles: 'Public',
              detail: 'Publicly accessible credential verification page. No login required.',
            },
          ].map((page) => (
            <div
              key={page.path}
              className="rounded-lg border border-gray-200 p-4 bg-white"
            >
              <div className="flex items-start justify-between gap-4 mb-1">
                <h3 className="font-medium text-gray-900 text-sm">
                  {page.name}
                </h3>
                <Link
                  to={page.path.includes(':') ? '#' : page.path}
                  className={`text-xs font-mono px-2 py-0.5 rounded bg-gray-50 shrink-0 ${
                    page.path.includes(':')
                      ? 'text-gray-400 cursor-default'
                      : 'text-blue-600 hover:bg-blue-50'
                  }`}
                  onClick={(e) => {
                    if (page.path.includes(':')) e.preventDefault();
                  }}
                >
                  {page.path}
                </Link>
              </div>
              <p className="text-xs text-gray-500 mb-2">{page.detail}</p>
              <span className="text-xs text-gray-400">
                Access: {page.roles}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Test Scenarios */}
      {activeTab === 'testing' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500 mb-4">
            Expand each scenario for step-by-step testing instructions.
          </p>
          {TEST_SCENARIOS.map((scenario, i) => (
            <ScenarioCard key={scenario.title} scenario={scenario} index={i} />
          ))}
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-gray-200 text-center">
        <p className="text-xs text-gray-400">
          SABIficate Team Guide — for internal use only
        </p>
      </div>
    </div>
  );
}
