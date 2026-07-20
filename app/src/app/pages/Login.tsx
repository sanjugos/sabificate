import { Navigate, useSearchParams } from 'react-router-dom';
import { LoginForm } from '../../components/auth/LoginForm';
import { useAuth } from '../../lib/auth/useAuth';

export default function Login() {
  const { isAuthenticated, isLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to={redirect} replace />;

  return (
    <div className="min-h-svh flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-blue-700">SABIficate</h1>
          <p className="text-sm text-gray-500 mt-1">Professional Microlearning</p>
        </div>
        <LoginForm />

        <div className="mt-6 border border-amber-200 bg-amber-50 rounded-lg p-4">
          <p className="text-xs font-semibold text-amber-800 mb-2">Test Accounts</p>
          <table className="w-full text-xs text-gray-700">
            <thead>
              <tr className="border-b border-amber-200">
                <th className="text-left py-1 font-medium">Role</th>
                <th className="text-left py-1 font-medium">Email</th>
                <th className="text-left py-1 font-medium">Password</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              <tr><td className="py-0.5">Learner</td><td>demo@sabificate.com</td><td>demo1234</td></tr>
              <tr><td className="py-0.5">Admin</td><td>admin@firstbank-training.ng</td><td>admin1234</td></tr>
              <tr><td className="py-0.5">Platform</td><td>platform@sabificate.com</td><td>staff1234</td></tr>
              <tr><td className="py-0.5">Author</td><td>author@sabificate.com</td><td>staff1234</td></tr>
              <tr><td className="py-0.5">SME</td><td>reviewer@sabificate.com</td><td>staff1234</td></tr>
            </tbody>
          </table>
        </div>

        <p className="text-center text-xs text-gray-300 mt-4" data-testid="build-id">build:20260720-v6</p>
      </div>
    </div>
  );
}
