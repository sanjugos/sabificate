import { useState } from 'react';

interface SetupStageProps {
  track: Record<string, unknown> | null;
  onCreateTrack: (data: {
    name: string;
    vertical: string;
    customer_tier: string;
    tier_treatment: string;
    credential_type: string;
    paywall_lesson_index: number;
  }) => void;
  onUpdateSetup: (data: Record<string, unknown>) => void;
  loading: boolean;
}

export function SetupStage({ track, onCreateTrack, onUpdateSetup, loading }: SetupStageProps) {
  const [name, setName] = useState((track?.name as string) || '');
  const [vertical, setVertical] = useState((track?.vertical as string) || 'financial-literacy');
  const [customerTier, setCustomerTier] = useState((track?.customer_tier as string) || 'freemium');
  const [tierTreatment, setTierTreatment] = useState((track?.tier_treatment as string) || 'A');
  const [credentialType, setCredentialType] = useState((track?.credential_type as string) || 'completion_badge');
  const [paywallIndex, setPaywallIndex] = useState((track?.paywall_lesson_index as number) || 2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name,
      vertical,
      customer_tier: customerTier,
      tier_treatment: tierTreatment,
      credential_type: credentialType,
      paywall_lesson_index: paywallIndex,
    };

    if (track) {
      onUpdateSetup(data);
    } else {
      onCreateTrack(data);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Stage 1: Track Setup</h3>
        <p className="text-sm text-gray-600 mt-1">
          Define the basic properties of this authoring track.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Track Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. AML Compliance for Branch Staff"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vertical</label>
          <select
            value={vertical}
            onChange={(e) => setVertical(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="financial-literacy">Financial Literacy</option>
            <option value="banking-compliance">Banking Compliance</option>
            <option value="insurance">Insurance</option>
            <option value="fintech">Fintech</option>
            <option value="professional-development">Professional Development</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Tier</label>
            <select
              value={customerTier}
              onChange={(e) => setCustomerTier(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="freemium">Freemium</option>
              <option value="hiring">Hiring</option>
              <option value="upskilling">Upskilling</option>
              <option value="premium">Premium</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tier Treatment</label>
            <select
              value={tierTreatment}
              onChange={(e) => setTierTreatment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="A">A - Standard</option>
              <option value="B">B - Enhanced</option>
              <option value="C">C - Premium</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Credential Type</label>
            <select
              value={credentialType}
              onChange={(e) => setCredentialType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="completion_badge">Completion Badge</option>
              <option value="verified_certificate">Verified Certificate</option>
              <option value="team_record">Team Record</option>
              <option value="professional_certificate">Professional Certificate</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Paywall After Lesson</label>
            <input
              type="number"
              min={0}
              max={20}
              value={paywallIndex}
              onChange={(e) => setPaywallIndex(parseInt(e.target.value, 10) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">Lessons before this index are free</p>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="w-full py-2 px-4 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : track ? 'Update Setup' : 'Create Track'}
        </button>
      </form>
    </div>
  );
}
