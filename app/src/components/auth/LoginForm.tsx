import { useState, useRef, useEffect, useCallback, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../lib/auth/useAuth';

export function LoginForm() {
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const busyRef = useRef(false);

  const doLogin = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;

    const form = formRef.current;
    const emailVal = form?.querySelector<HTMLInputElement>('#login-email')?.value || email;
    const passwordVal = form?.querySelector<HTMLInputElement>('#login-password')?.value || password;

    setError(null);
    setIsSubmitting(true);

    try {
      await login({ email: emailVal, password: passwordVal });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
      busyRef.current = false;
    }
  }, [login, email, password]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    doLogin();
  }

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    function onNativeSubmit(e: Event) {
      e.preventDefault();
      doLogin();
    }

    form.addEventListener('submit', onNativeSubmit);
    return () => form.removeEventListener('submit', onNativeSubmit);
  }, [doLogin]);

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="w-full max-w-sm mx-auto space-y-5 px-4">
      <h1 className="text-2xl font-bold text-center text-gray-900">Sign in</h1>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="login-email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="block w-full min-h-[44px] rounded-lg border border-gray-300 px-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="you@example.com"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="login-password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="block w-full min-h-[44px] rounded-lg border border-gray-300 px-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Enter your password"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full min-h-[44px] items-center justify-center rounded-lg bg-blue-600 text-base font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </button>

      <div className="flex items-center justify-end text-sm">
        <Link to={redirect ? `/register?redirect=${encodeURIComponent(redirect)}` : '/register'} className="text-blue-600 hover:underline">
          Create account
        </Link>
      </div>
    </form>
  );
}
