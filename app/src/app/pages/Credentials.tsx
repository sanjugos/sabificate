import { useState } from 'react';
import type { Credential } from '../../../contracts/api/credentials';
import { CredentialList } from '../../components/credentials/CredentialList';
import { CredentialDetail } from '../../components/credentials/CredentialDetail';

export default function Credentials() {
  const [selected, setSelected] = useState<Credential | null>(null);

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
