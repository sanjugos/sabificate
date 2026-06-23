interface SpineNode {
  index: number;
  concept_id: string | null;
  title: string;
  objective: string;
  bloom_level: string;
  artifact_intent: string;
  catalog_overlap: string;
  linked_concept_catalog_id: string | null;
  sme_approved: boolean;
}

interface DecomposeStageProps {
  track: Record<string, unknown> | null;
  onDecompose: () => void;
  onUpdateSpine: (spine: SpineNode[]) => void;
  loading: boolean;
}

export function DecomposeStage({ track, onDecompose, onUpdateSpine, loading }: DecomposeStageProps) {
  const spine = (track?.spine as SpineNode[]) || [];
  const hasSpine = spine.length > 0;
  const decompositionMeta = track?.decomposition_meta as Record<string, unknown> | null;

  const handleApproveNode = (idx: number) => {
    const updated = spine.map((node, i) =>
      i === idx ? { ...node, sme_approved: !node.sme_approved } : node,
    );
    onUpdateSpine(updated);
  };

  const handleRemoveNode = (idx: number) => {
    const updated = spine
      .filter((_, i) => i !== idx)
      .map((node, i) => ({ ...node, index: i }));
    onUpdateSpine(updated);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Stage 3: AI Decomposition</h3>
        <p className="text-sm text-gray-600 mt-1">
          The AI decomposes the skill statement into a learning spine of 3-6 concept nodes.
          Review and edit the spine before proceeding.
        </p>
      </div>

      {!hasSpine && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-sm text-yellow-800">
            Click the button below to trigger AI decomposition of the skill statement into spine nodes.
          </p>
          <button
            onClick={onDecompose}
            disabled={loading}
            className="mt-3 py-2 px-4 bg-yellow-600 text-white text-sm font-medium rounded-md hover:bg-yellow-700 disabled:opacity-50"
          >
            {loading ? 'Decomposing...' : 'Run AI Decomposition'}
          </button>
        </div>
      )}

      {decompositionMeta && (
        <div className="bg-gray-50 rounded-md p-3 text-xs text-gray-600">
          <p>Model: {decompositionMeta.ai_model_used as string}</p>
          <p>Nodes generated: {decompositionMeta.original_spine_count as number}</p>
          <p>Catalog matches: {decompositionMeta.catalog_matches_found as number}</p>
        </div>
      )}

      {hasSpine && (
        <div className="space-y-3">
          {spine.map((node) => (
            <div
              key={node.index}
              className={`border rounded-md p-4 ${
                node.sme_approved
                  ? 'border-green-300 bg-green-50'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
                      {node.index + 1}
                    </span>
                    <h4 className="text-sm font-semibold text-gray-900">{node.title}</h4>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 ml-8">{node.objective}</p>
                  <div className="flex gap-2 mt-2 ml-8">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-medium">
                      {node.bloom_level}
                    </span>
                    <span className="inline-block px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-medium">
                      {node.catalog_overlap}
                    </span>
                    {node.concept_id && (
                      <span className="inline-block px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 text-[10px] font-medium">
                        {node.concept_id}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleApproveNode(node.index)}
                    className={`px-2 py-1 text-xs rounded ${
                      node.sme_approved
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-green-100'
                    }`}
                  >
                    {node.sme_approved ? 'Approved' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleRemoveNode(node.index)}
                    className="px-2 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
