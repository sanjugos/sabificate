import { useState, useRef, useEffect, useCallback, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../lib/auth/useAuth';

export function RegisterForm() {
  const { register } = useAuth();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const [consentEducation, setConsentEducation] = useState(true);
  const [consentAggregate, setConsentAggregate] = useState(false);
  const [consentFullProfile, setConsentFullProfile] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const busyRef = useRef(false);

  const doRegister = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;

    const form = formRef.current;
    const emailVal = form?.querySelector<HTMLInputElement>('#reg-email')?.value || email;
    const passwordVal = form?.querySelector<HTMLInputElement>('#reg-password')?.value || password;
    const firstVal = form?.querySelector<HTMLInputElement>('#reg-first-name')?.value || firstName;
    const lastVal = form?.querySelector<HTMLInputElement>('#reg-last-name')?.value || lastName;
    const phoneVal = form?.querySelector<HTMLInputElement>('#reg-phone')?.value || phoneNumber;

    setError(null);

    if (passwordVal.length < 8) {
      setError('Password must be at least 8 characters.');
      busyRef.current = false;
      return;
    }
    if (!/\d/.test(passwordVal)) {
      setError('Password must contain at least one number.');
      busyRef.current = false;
      return;
    }
    if (!consentEducation) {
      setError('You must consent to educational data use to create an account.');
      busyRef.current = false;
      return;
    }

    setIsSubmitting(true);

    try {
      await register({
        email: emailVal,
        password: passwordVal,
        first_name: firstVal,
        last_name: lastVal,
        phone_number: phoneVal || undefined,
        invitation_token: searchParams.get('token') ?? undefined,
        consent: {
          education_only: consentEducation,
          anonymized_aggregate: consentAggregate,
          full_profile: consentFullProfile,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
      busyRef.current = false;
    }
  }, [register, email, password, firstName, lastName, phoneNumber, consentEducation, consentAggregate, consentFullProfile, searchParams]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    doRegister();
  }

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    function onNativeSubmit(e: Event) {
      e.preventDefault();
      doRegister();
    }

    form.addEventListener('submit', onNativeSubmit);
    return () => form.removeEventListener('submit', onNativeSubmit);
  }, [doRegister]);

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="w-full max-w-sm mx-auto space-y-5 px-4">
      <h1 className="text-2xl font-bold text-center text-gray-900">Create account</h1>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* First + Last Name */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor="reg-first-name" className="block text-sm font-medium text-gray-700">
            First name
          </label>
          <input
            id="reg-first-name"
            type="text"
            required
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="block w-full min-h-[44px] rounded-lg border border-gray-300 px-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="reg-last-name" className="block text-sm font-medium text-gray-700">
            Last name
          </label>
          <input
            id="reg-last-name"
            type="text"
            required
            autoComplete="family-name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="block w-full min-h-[44px] rounded-lg border border-gray-300 px-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="reg-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="block w-full min-h-[44px] rounded-lg border border-gray-300 px-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="you@example.com"
        />
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="reg-password"
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="block w-full min-h-[44px] rounded-lg border border-gray-300 px-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Min 8 characters, include a number"
        />
      </div>

      {/* Phone (optional) */}
      <div className="space-y-1.5">
        <label htmlFor="reg-phone" className="block text-sm font-medium text-gray-700">
          Phone number{' '}
          <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <input
          id="reg-phone"
          type="tel"
          autoComplete="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="block w-full min-h-[44px] rounded-lg border border-gray-300 px-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="+234..."
        />
      </div>

      {/* Consent Checkboxes */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-gray-700">Data consent</legend>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={consentEducation}
            onChange={(e) => setConsentEducation(e.target.checked)}
            className="mt-0.5 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">
            I consent to my data being used for educational purposes.{' '}
            <span className="text-red-500">*</span>
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={consentAggregate}
            onChange={(e) => setConsentAggregate(e.target.checked)}
            className="mt-0.5 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">
            I consent to anonymized, aggregate analytics.
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={consentFullProfile}
            onChange={(e) => setConsentFullProfile(e.target.checked)}
            className="mt-0.5 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">
            I consent to full profile data processing.
          </span>
        </label>
      </fieldset>

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full min-h-[44px] items-center justify-center rounded-lg bg-blue-600 text-base font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? 'Creating account...' : 'Create account'}
      </button>

      <p className="text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link to="/login" className="text-blue-600 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
