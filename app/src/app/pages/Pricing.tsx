import { Link } from 'react-router-dom';

// ── Plan data ───────────────────────────────────────────────────────────────

const individualPlans = [
  {
    name: 'Free',
    price: '0',
    period: '/month',
    currency: 'NGN',
    features: [
      'Access all course content',
      'Completion badges',
      'Community access',
    ],
    cta: 'Current Plan',
    ctaDisabled: true,
    href: '#',
    highlight: false,
  },
  {
    name: 'Professional',
    price: '2,500',
    period: '/month',
    currency: 'NGN',
    features: [
      'Everything in Free',
      'Verified certificates',
      'CPD tracking',
      'Priority support',
    ],
    cta: 'Subscribe',
    ctaDisabled: false,
    href: '/subscribe',
    highlight: true,
  },
  {
    name: 'Annual',
    price: '24,000',
    period: '/year',
    currency: 'NGN',
    features: [
      'Everything in Professional',
      '2 months free',
    ],
    savings: 'Save NGN 6,000',
    cta: 'Subscribe',
    ctaDisabled: false,
    href: '/subscribe',
    highlight: false,
  },
];

const b2bPlans = [
  {
    name: 'Compliance Essentials',
    price: '3,500',
    period: '/seat/month',
    currency: 'NGN',
  },
  {
    name: 'Professional',
    price: '5,500',
    period: '/seat/month',
    currency: 'NGN',
  },
  {
    name: 'Enterprise',
    price: '8,000',
    period: '/seat/month',
    currency: 'NGN',
  },
];

// ── Component ───────────────────────────────────────────────────────────────

export default function Pricing() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Choose Your Plan
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Invest in your professional development with Nigeria's premier
          compliance education platform.
        </p>
      </div>

      {/* Individual Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {individualPlans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-xl border p-8 flex flex-col ${
              plan.highlight
                ? 'border-blue-600 ring-2 ring-blue-600 shadow-lg'
                : 'border-gray-200 shadow-sm'
            }`}
          >
            {plan.highlight && (
              <span className="inline-block self-start bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full mb-4">
                Most Popular
              </span>
            )}
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {plan.name}
            </h2>
            <div className="mb-6">
              <span className="text-sm text-gray-500">{plan.currency} </span>
              <span className="text-4xl font-bold text-gray-900">
                {plan.price}
              </span>
              <span className="text-gray-500">{plan.period}</span>
              {plan.savings && (
                <p className="text-sm text-green-600 font-medium mt-1">
                  {plan.savings}
                </p>
              )}
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-gray-700">
                  <svg
                    className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12.75l6 6 9-13.5"
                    />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
            {plan.ctaDisabled ? (
              <button
                disabled
                className="w-full py-3 px-4 rounded-lg text-sm font-semibold bg-gray-100 text-gray-400 cursor-not-allowed"
              >
                {plan.cta}
              </button>
            ) : (
              <Link
                to={plan.href}
                className={`w-full py-3 px-4 rounded-lg text-sm font-semibold text-center block ${
                  plan.highlight
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}
              >
                {plan.cta}
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* B2B Section */}
      <div className="border-t border-gray-200 pt-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            For Organizations
          </h2>
          <p className="text-gray-600">
            Empower your team with compliance training at scale.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {b2bPlans.map((plan) => (
            <div
              key={plan.name}
              className="rounded-xl border border-gray-200 p-8 shadow-sm"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {plan.name}
              </h3>
              <div className="mb-4">
                <span className="text-sm text-gray-500">{plan.currency} </span>
                <span className="text-3xl font-bold text-gray-900">
                  {plan.price}
                </span>
                <span className="text-gray-500">{plan.period}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <a
            href="mailto:sales@sabificate.com?subject=Enterprise%20Pricing%20Inquiry"
            className="inline-block py-3 px-8 rounded-lg text-sm font-semibold bg-gray-900 text-white hover:bg-gray-800"
          >
            Contact Sales
          </a>
        </div>
      </div>
    </div>
  );
}
