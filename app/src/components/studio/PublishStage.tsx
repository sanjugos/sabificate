interface PublishStageProps {
  track: Record<string, unknown> | null;
  onPublish: () => void;
  onUnpublish: () => void;
  loading: boolean;
}

export function PublishStage({ track, onPublish, onUnpublish, loading }: PublishStageProps) {
  const status = (track?.status as string) || 'draft';
  const isPublished = status === 'published';
  const publishedCourseId = track?.published_course_id as string | null;
  const publishedAt = track?.published_at as string | null;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Stage 7: Publish</h3>
        <p className="text-sm text-gray-600 mt-1">
          Convert the authoring track into live courses, modules, and lessons.
          Requires platform_admin role.
        </p>
      </div>

      {isPublished ? (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <h4 className="text-sm font-semibold text-green-800 mb-2">Published Successfully</h4>
            <div className="text-xs text-green-700 space-y-1">
              {publishedCourseId && <p>Course ID: {publishedCourseId}</p>}
              {publishedAt && <p>Published: {new Date(publishedAt).toLocaleString()}</p>}
            </div>
          </div>

          <button
            onClick={onUnpublish}
            disabled={loading}
            className="w-full py-2 px-4 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Unpublishing...' : 'Unpublish Course'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {status === 'review' ? (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <p className="text-sm text-blue-800">
                  This track has passed assembly review and is ready to publish.
                  Publishing will create:
                </p>
                <ul className="mt-2 text-xs text-blue-700 space-y-1 list-disc list-inside">
                  <li>A new course record</li>
                  <li>One module per spine node</li>
                  <li>One lesson per spine node with 3-tier content</li>
                  <li>Persona and calibration question records</li>
                  <li>Credential template</li>
                </ul>
              </div>

              <button
                onClick={onPublish}
                disabled={loading}
                className="w-full py-2 px-4 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Publishing...' : 'Publish to Live'}
              </button>
            </>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
              <p className="text-sm text-gray-600">
                This track must be in &quot;review&quot; status (i.e., assembly review approved) before it can be published.
                Current status: <span className="font-semibold">{status}</span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
