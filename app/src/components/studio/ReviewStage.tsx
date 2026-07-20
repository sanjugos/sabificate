import { useState, useMemo, useCallback } from 'react';
import type { SpineNode } from '../../../server/services/curriculumAI';
import {
  initializeSectionReviews,
  approveSectionReview,
  requestSectionRevision,
  getRevisionRequestedSections,
  type SectionReview,
} from '../../../server/services/sectionReview';

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

const TIER_LABELS: Record<string, string> = {
  foundational: 'Foundational',
  working: 'Working',
  applied: 'Applied',
};

const STATUS_STYLES: Record<string, string> = {
  pending_review: 'bg-gray-100 text-gray-700',
  approved: 'bg-green-100 text-green-700',
  revision_requested: 'bg-amber-100 text-amber-700',
};

const STATUS_LABELS: Record<string, string> = {
  pending_review: 'Pending Review',
  approved: 'Approved',
  revision_requested: 'Revision Requested',
};

export function ReviewStage({ track, onStartReview, onCompleteReview, loading }: ReviewStageProps) {
  const latestReview = track?.latest_review as Record<string, unknown> | null;
  const spine = (track?.spine as SpineNode[]) || [];

  // Per-section review state
  const [sectionReviews, setSectionReviews] = useState<SectionReview[]>(() => {
    if (spine.length > 0 && track?.id) {
      return initializeSectionReviews(track.id as string, spine);
    }
    return [];
  });
  const [revisionComments, setRevisionComments] = useState<Record<string, string>>({});
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  // Derived state
  const revisionRequested = useMemo(
    () => getRevisionRequestedSections(sectionReviews),
    [sectionReviews],
  );
  const approvedCount = useMemo(
    () => sectionReviews.filter((r) => r.status === 'approved').length,
    [sectionReviews],
  );
  const allApproved = sectionReviews.length > 0 && approvedCount === sectionReviews.length;

  // Handlers
  const handleApprove = useCallback((reviewId: string) => {
    setSectionReviews((prev) => approveSectionReview(prev, reviewId));
  }, []);

  const handleRequestRevision = useCallback((reviewId: string) => {
    const comment = revisionComments[reviewId] || '';
    if (!comment.trim()) return;
    setSectionReviews((prev) => requestSectionRevision(prev, reviewId, comment));
    setExpandedSection(null);
  }, [revisionComments]);

  const handleCommentChange = useCallback((reviewId: string, value: string) => {
    setRevisionComments((prev) => ({ ...prev, [reviewId]: value }));
  }, []);

  const handleComplete = () => {
    onCompleteReview({
      terminology_drift_ok: allApproved,
      difficulty_inversion_ok: allApproved,
      artifact_redundancy_ok: allApproved,
      coverage_gap_ok: allApproved,
      reviewer_notes: notes || `Per-section review: ${approvedCount}/${sectionReviews.length} approved, ${revisionRequested.length} revision(s) requested.`,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Stage 6: Assembly Review</h3>
        <p className="text-sm text-gray-600 mt-1">
          Review each section individually. Approve sections that meet quality standards
          or request revision with specific feedback for the AI to address.
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
            <p className="mt-1">
              Sections: {approvedCount}/{sectionReviews.length} approved
              {revisionRequested.length > 0 && (
                <span className="ml-2 text-amber-700">
                  ({revisionRequested.length} revision{revisionRequested.length !== 1 ? 's' : ''} requested)
                </span>
              )}
            </p>
          </div>

          {(latestReview.status === 'in_progress') && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-700">Per-Section Review</h4>

              {spine.map((node) => (
                <div key={node.index} className="border border-gray-200 rounded-md overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                    <h5 className="text-sm font-semibold text-gray-900">
                      Node {node.index}: {node.title}
                    </h5>
                    <p className="text-xs text-gray-500 mt-0.5">{node.objective}</p>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {(['foundational', 'working', 'applied'] as const).map((tier) => {
                      const review = sectionReviews.find(
                        (r) => r.spineNodeIndex === node.index && r.depthTier === tier,
                      );
                      if (!review) return null;

                      const isExpanded = expandedSection === review.id;

                      return (
                        <div key={tier} className="px-4 py-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-800">
                                {TIER_LABELS[tier]}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[review.status]}`}>
                                {STATUS_LABELS[review.status]}
                              </span>
                              {review.revisionCount > 0 && (
                                <span className="text-xs text-gray-400">
                                  (revision #{review.revisionCount})
                                </span>
                              )}
                            </div>

                            {review.status !== 'approved' && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleApprove(review.id)}
                                  disabled={loading}
                                  className="px-3 py-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded hover:bg-green-100 disabled:opacity-50"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => setExpandedSection(isExpanded ? null : review.id)}
                                  disabled={loading}
                                  className="px-3 py-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded hover:bg-amber-100 disabled:opacity-50"
                                >
                                  {isExpanded ? 'Cancel' : 'Request Revision'}
                                </button>
                              </div>
                            )}
                          </div>

                          {review.reviewerComment && review.status === 'revision_requested' && (
                            <p className="mt-2 text-xs text-amber-700 bg-amber-50 p-2 rounded">
                              Feedback: {review.reviewerComment}
                            </p>
                          )}

                          {isExpanded && (
                            <div className="mt-3 space-y-2">
                              <textarea
                                value={revisionComments[review.id] || ''}
                                onChange={(e) => handleCommentChange(review.id, e.target.value)}
                                placeholder="Describe what needs to change..."
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs"
                              />
                              <button
                                onClick={() => handleRequestRevision(review.id)}
                                disabled={loading || !(revisionComments[review.id] || '').trim()}
                                className="px-3 py-1.5 text-xs font-medium text-white bg-amber-600 rounded hover:bg-amber-700 disabled:opacity-50"
                              >
                                Submit Revision Request
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

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
                  allApproved
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {loading
                  ? 'Submitting...'
                  : allApproved
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
