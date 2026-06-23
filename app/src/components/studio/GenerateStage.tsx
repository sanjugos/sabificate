interface SpineNode {
  index: number;
  title: string;
  objective: string;
  bloom_level: string;
  depth_cards: {
    foundational: { blocks: unknown[] };
    working: { blocks: unknown[] };
    applied: { blocks: unknown[] };
  } | null;
  trust_claim_count: number;
}

interface GenerateStageProps {
  track: Record<string, unknown> | null;
  onGenerate: () => void;
  loading: boolean;
}

export function GenerateStage({ track, onGenerate, loading }: GenerateStageProps) {
  const spine = (track?.spine as SpineNode[]) || [];
  const generationMeta = track?.generation_meta as Record<string, unknown> | null;
  const hasContent = spine.some((node) => node.depth_cards !== null);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Stage 5: AI Course Generation</h3>
        <p className="text-sm text-gray-600 mt-1">
          The AI generates 3 depth cards (foundational, working, applied) for each spine node
          using the brief and prompt templates.
        </p>
      </div>

      {!hasContent && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-sm text-yellow-800">
            Click below to generate course content. The AI will create content blocks for each
            depth tier across all spine nodes, and flag numeric/regulatory claims for verification.
          </p>
          <button
            onClick={onGenerate}
            disabled={loading}
            className="mt-3 py-2 px-4 bg-yellow-600 text-white text-sm font-medium rounded-md hover:bg-yellow-700 disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate Course Content'}
          </button>
        </div>
      )}

      {generationMeta && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <h4 className="text-sm font-semibold text-green-800 mb-2">Generation Complete</h4>
          <div className="grid grid-cols-2 gap-2 text-xs text-green-700">
            <p>Model: {generationMeta.ai_model_used as string}</p>
            <p>Total blocks: {generationMeta.total_blocks_generated as number}</p>
            <p>Trust claims flagged: {generationMeta.trust_claims_flagged as number}</p>
            <p>Languages: {(generationMeta.languages_requested as string[])?.join(', ')}</p>
          </div>
        </div>
      )}

      {hasContent && (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700">Generated Content Summary</h4>
          {spine.map((node) => (
            <div key={node.index} className="border border-gray-200 rounded-md p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
                  {node.index + 1}
                </span>
                <span className="text-sm font-medium text-gray-900">{node.title}</span>
              </div>
              {node.depth_cards && (
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-green-50 rounded p-2">
                    <span className="font-medium text-green-700">Foundational</span>
                    <p className="text-green-600 mt-0.5">
                      {node.depth_cards.foundational.blocks.length} blocks
                    </p>
                  </div>
                  <div className="bg-blue-50 rounded p-2">
                    <span className="font-medium text-blue-700">Working</span>
                    <p className="text-blue-600 mt-0.5">
                      {node.depth_cards.working.blocks.length} blocks
                    </p>
                  </div>
                  <div className="bg-purple-50 rounded p-2">
                    <span className="font-medium text-purple-700">Applied</span>
                    <p className="text-purple-600 mt-0.5">
                      {node.depth_cards.applied.blocks.length} blocks
                    </p>
                  </div>
                </div>
              )}
              {node.trust_claim_count > 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  {node.trust_claim_count} trust claim(s) flagged for verification
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
