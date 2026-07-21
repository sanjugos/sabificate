import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { Credential } from '../../../contracts/api/credentials';
import { CredentialList } from '../../components/credentials/CredentialList';
import { CredentialDetail } from '../../components/credentials/CredentialDetail';
import { useAuth } from '../../lib/auth/useAuth';

export default function Credentials() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const [selected, setSelected] = useState<Credential | null>(null);

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
        <p className="text-gray-500 mb-4">Sign in to view your credentials</p>
        <Link to={`/login?redirect=${encodeURIComponent(location.pathname)}`} className="text-blue-700 font-medium">Sign In</Link>
      </div>
    );
  }

  if (selected) {
    return (
      <div className="p-4">
        <CredentialDetail
          credential={selected}
          onBack={() => setSelected(null)}
        />
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="mb-4 text-xl font-bold text-gray-900">My Credentials</h1>
      <CredentialList onSelect={setSelected} />
    </div>
  );
}
