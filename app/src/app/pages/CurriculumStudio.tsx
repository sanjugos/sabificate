import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/auth/useAuth';
import { api } from '../../lib/api/client';
import { StageTracker } from '../../components/studio/StageTracker';
import { SetupStage } from '../../components/studio/SetupStage';
import { IntakeStage } from '../../components/studio/IntakeStage';
import { DecomposeStage } from '../../components/studio/DecomposeStage';
import { BriefStage } from '../../components/studio/BriefStage';
import { GenerateStage } from '../../components/studio/GenerateStage';
import { ReviewStage } from '../../components/studio/ReviewStage';
import { PublishStage } from '../../components/studio/PublishStage';

const STATUS_TO_STAGE: Record<string, number> = {
  draft: 0,
  intake: 1,
  decomposition: 2,
  briefing: 3,
  generation: 4,
  review: 5,
  published: 6,
};

type Track = Record<string, unknown>;

export default function CurriculumStudio() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const canCreateTrack = useMemo(() => {
    const authorRoles = ['curriculum_author', 'platform_admin', 'corporate_admin', 'founder', 'admin'];
    return user?.role ? authorRoles.includes(user.role) : false;
  }, [user]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [track, setTrack] = useState<Track | null>(null);
  const [activeStage, setActiveStage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'editor'>('list');

  // ── Fetch tracks ──────────────────────────────────────────────────────

  const fetchTracks = useCallback(async () => {
    try {
      const data = await api.get<{ data: Track[] }>('/studio/tracks');
      setTracks(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tracks');
    }
  }, []);

  const fetchTrack = useCallback(async (trackId: string) => {
    try {
      setLoading(true);
      const data = await api.get<Track>(`/studio/tracks/${trackId}`);
      setTrack(data);
      const status = (data.status as string) || 'draft';
      setActiveStage(STATUS_TO_STAGE[status] ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load track');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchTracks();
  }, [fetchTracks, isAuthenticated]);

  useEffect(() => {
    if (selectedTrackId) {
      fetchTrack(selectedTrackId);
    }
  }, [selectedTrackId, fetchTrack]);

  // ── Handlers ──────────────────────────────────────────────────────────

  const handleCreateTrack = async (data: Record<string, unknown>) => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.post<{ data: Track }>('/studio/tracks', data);
      const newTrack = result.data;
      setSelectedTrackId(newTrack.id as string);
      setView('editor');
      fetchTracks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create track');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSetup = async (data: Record<string, unknown>) => {
    if (!selectedTrackId) return;
    try {
      setLoading(true);
      setError(null);
      await api.put(`/studio/tracks/${selectedTrackId}/setup`, data);
      fetchTrack(selectedTrackId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update setup');
    } finally {
      setLoading(false);
    }
  };

  const handleIntake = async (data: Record<string, unknown>) => {
    if (!selectedTrackId) return;
    try {
      setLoading(true);
      setError(null);
      await api.post(`/studio/tracks/${selectedTrackId}/intake`, data);
      fetchTrack(selectedTrackId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit intake');
    } finally {
      setLoading(false);
    }
  };

  const handleDecompose = async () => {
    if (!selectedTrackId) return;
    try {
      setLoading(true);
      setError(null);
      await api.post(`/studio/tracks/${selectedTrackId}/decompose`);
      fetchTrack(selectedTrackId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decompose');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSpine = async (spine: unknown[]) => {
    if (!selectedTrackId) return;
    try {
      setLoading(true);
      setError(null);
      await api.put(`/studio/tracks/${selectedTrackId}/spine`, { spine });
      fetchTrack(selectedTrackId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update spine');
    } finally {
      setLoading(false);
    }
  };

  const handleBrief = async (data: Record<string, unknown>) => {
    if (!selectedTrackId) return;
    try {
      setLoading(true);
      setError(null);
      await api.post(`/studio/tracks/${selectedTrackId}/brief`, data);
      fetchTrack(selectedTrackId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit brief');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedTrackId) return;
    try {
      setLoading(true);
      setError(null);
      await api.post(`/studio/tracks/${selectedTrackId}/generate`);
      fetchTrack(selectedTrackId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate');
    } finally {
      setLoading(false);
    }
  };

  const handleStartReview = async () => {
    if (!selectedTrackId) return;
    try {
      setLoading(true);
      setError(null);
      await api.post(`/studio/tracks/${selectedTrackId}/review`);
      fetchTrack(selectedTrackId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start review');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteReview = async (data: Record<string, unknown>) => {
    if (!selectedTrackId) return;
    try {
      setLoading(true);
      setError(null);
      await api.post(`/studio/tracks/${selectedTrackId}/review/complete`, data);
      fetchTrack(selectedTrackId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete review');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedTrackId) return;
    try {
      setLoading(true);
      setError(null);
      await api.post(`/studio/tracks/${selectedTrackId}/publish`);
      fetchTrack(selectedTrackId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish');
    } finally {
      setLoading(false);
    }
  };

  const handleUnpublish = async () => {
    if (!selectedTrackId) return;
    try {
      setLoading(true);
      setError(null);
      await api.post(`/studio/tracks/${selectedTrackId}/unpublish`);
      fetchTrack(selectedTrackId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unpublish');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrack = async (trackId: string) => {
    try {
      setLoading(true);
      setError(null);
      await api.delete(`/studio/tracks/${trackId}`);
      if (selectedTrackId === trackId) {
        setSelectedTrackId(null);
        setTrack(null);
        setView('list');
      }
      fetchTracks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete track');
    } finally {
      setLoading(false);
    }
  };

  // ── Auth gate ─────────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Curriculum Studio</h2>
        <p className="text-gray-500 mb-6">Sign in with an author account to access the authoring pipeline.</p>
        <Link
          to="/login?redirect=/studio"
          className="inline-block px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
        >
          Sign In
        </Link>
      </div>
    );
  }

  // ── Track list view ───────────────────────────────────────────────────

  if (view === 'list') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-900">Curriculum Studio</h2>
              <Link
                to="/catalog"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Concept Catalog
              </Link>
            </div>
            <p className="text-sm text-gray-600 mt-1">7-stage authoring pipeline for course creation</p>
          </div>
          {canCreateTrack && (
            <button
              onClick={() => {
                setSelectedTrackId(null);
                setTrack(null);
                setActiveStage(0);
                setView('editor');
              }}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
            >
              + New Track
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
            {error}
          </div>
        )}

        {tracks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg font-medium">No authoring tracks yet</p>
            <p className="text-sm mt-1">Create your first track to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tracks.map((t) => (
              <div
                key={t.id as string}
                className="border border-gray-200 rounded-md p-4 hover:border-blue-300 cursor-pointer transition-colors"
                onClick={() => {
                  setSelectedTrackId(t.id as string);
                  setView('editor');
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{t.name as string}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                        {t.status as string}
                      </span>
                      <span className="text-xs text-gray-500">{t.vertical as string}</span>
                      <span className="text-xs text-gray-400">{t.customer_tier as string}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                      {t.updated_at ? new Date(t.updated_at as string).toLocaleDateString() : ''}
                    </span>
                    {['draft', 'intake'].includes(t.status as string) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTrack(t.id as string);
                        }}
                        className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Editor view ───────────────────────────────────────────────────────

  const currentStatus = (track?.status as string) || 'draft';

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => {
            setView('list');
            setSelectedTrackId(null);
            setTrack(null);
          }}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          &larr; Back to Tracks
        </button>
        {track && (
          <h2 className="text-lg font-bold text-gray-900">{track.name as string}</h2>
        )}
        {!track && (
          <h2 className="text-lg font-bold text-gray-900">New Authoring Track</h2>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">
            dismiss
          </button>
        </div>
      )}

      {track && (
        <div className="mb-6">
          <StageTracker
            currentStatus={currentStatus}
            activeStage={activeStage}
            onStageClick={setActiveStage}
          />
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        {activeStage === 0 && (
          <SetupStage
            track={track}
            onCreateTrack={handleCreateTrack}
            onUpdateSetup={handleUpdateSetup}
            loading={loading}
          />
        )}
        {activeStage === 1 && (
          <IntakeStage
            track={track}
            onSubmitIntake={handleIntake}
            loading={loading}
          />
        )}
        {activeStage === 2 && (
          <DecomposeStage
            track={track}
            onDecompose={handleDecompose}
            onUpdateSpine={handleUpdateSpine}
            loading={loading}
          />
        )}
        {activeStage === 3 && (
          <BriefStage
            track={track}
            onSubmitBrief={handleBrief}
            loading={loading}
          />
        )}
        {activeStage === 4 && (
          <GenerateStage
            track={track}
            onGenerate={handleGenerate}
            loading={loading}
          />
        )}
        {activeStage === 5 && (
          <ReviewStage
            track={track}
            onStartReview={handleStartReview}
            onCompleteReview={handleCompleteReview}
            loading={loading}
          />
        )}
        {activeStage === 6 && (
          <PublishStage
            track={track}
            onPublish={handlePublish}
            onUnpublish={handleUnpublish}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
}
