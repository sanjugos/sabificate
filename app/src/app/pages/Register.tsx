import { Navigate } from 'react-router-dom';
import { RegisterForm } from '../../components/auth/RegisterForm';
import { useAuth } from '../../lib/auth/useAuth';

export default function Register() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to="/" replace />;

  return (
    <div className="min-h-svh flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-blue-700">SABIficate</h1>
          <p className="text-sm text-gray-500 mt-1">Create your account</p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}
