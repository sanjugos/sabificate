import { useState } from 'react';

interface ReviewStageProps {
  track: Record<string, unknown> | null;
  onStartReview: () => void;
  onCompleteReview: (data: {
    terminology_drift_ok: boolean;
    difficulty_inversion_ok: boolean;
    artifact_redundancy_ok: boolean;
    coverage_gap_ok: boolean;
    reviewer_notes: string;
  }) => void;
  loading: boolean;
}

export function ReviewStage({ track, onStartReview, onCompleteReview, loading }: ReviewStageProps) {
  const latestReview = track?.latest_review as Record<string, unknown> | null;
  const [terminologyOk, setTerminologyOk] = useState(false);
  const [difficultyOk, setDifficultyOk] = useState(false);
  const [artifactOk, setArtifactOk] = useState(false);
  const [coverageOk, setCoverageOk] = useState(false);
  const [notes, setNotes] = useState('');

  const handleComplete = () => {
    onCompleteReview({
      terminology_drift_ok: terminologyOk,
      difficulty_inversion_ok: difficultyOk,
      artifact_redundancy_ok: artifactOk,
      coverage_gap_ok: coverageOk,
      reviewer_notes: notes,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Stage 6: Assembly Review</h3>
        <p className="text-sm text-gray-600 mt-1">
          SME plays through all spine nodes end-to-end, checking for terminology drift,
          difficulty inversions, artifact redundancy, and coverage gaps.
        </p>
      </div>

      {!latestReview && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-sm text-yellow-800 mb-3">
            Start a new assembly review to evaluate the generated content.
          </p>
          <button
            onClick={onStartReview}
            disabled={loading}
            className="py-2 px-4 bg-yellow-600 text-white text-sm font-medium rounded-md hover:bg-yellow-700 disabled:opacity-50"
          >
            {loading ? 'Starting...' : 'Start Assembly Review'}
          </button>
        </div>
      )}

      {latestReview && (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-xs text-blue-700">
            <p>Review status: <span className="font-semibold">{latestReview.status as string}</span></p>
            <p>Started: {new Date(latestReview.started_at as string).toLocaleString()}</p>
          </div>

          {(latestReview.status === 'in_progress') && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-700">Review Checklist</h4>

              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={terminologyOk}
                    onChange={(e) => setTerminologyOk(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Terminology Consistency</span>
                    <p className="text-xs text-gray-500">No terminology drift across spine nodes. Key terms are used consistently.</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={difficultyOk}
                    onChange={(e) => setDifficultyOk(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Difficulty Progression</span>
                    <p className="text-xs text-gray-500">No difficulty inversions. Foundational content is simpler than working, which is simpler than applied.</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={artifactOk}
                    onChange={(e) => setArtifactOk(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Artifact Quality</span>
                    <p className="text-xs text-gray-500">No redundant artifacts. Each artifact serves a distinct learning purpose.</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={coverageOk}
                    onChange={(e) => setCoverageOk(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Coverage Completeness</span>
                    <p className="text-xs text-gray-500">No coverage gaps. All aspects of the skill statement are addressed.</p>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reviewer Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes or feedback..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>

              <button
                onClick={handleComplete}
                disabled={loading}
                className={`w-full py-2 px-4 text-white text-sm font-medium rounded-md disabled:opacity-50 ${
                  terminologyOk && difficultyOk && artifactOk && coverageOk
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {loading
                  ? 'Submitting...'
                  : terminologyOk && difficultyOk && artifactOk && coverageOk
                    ? 'Approve and Complete Review'
                    : 'Request Changes'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
