import { useState, useCallback } from 'react';
import type { DecisionNode } from '../../../contracts/schemas/content';

interface ScenarioBlockProps {
  scenario: string;
  company_type: string;
  regulatory_body: string;
  cultural_notes: string;
  decision_tree: DecisionNode[];
  blockId?: string;
  onComplete?: (blockId: string, decisions: { nodeId: string; choiceLabel: string; feedback: string }[]) => void;
}

export function ScenarioBlock({
  scenario,
  company_type,
  regulatory_body,
  cultural_notes,
  decision_tree,
  blockId,
  onComplete,
}: ScenarioBlockProps) {
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(
    decision_tree.length > 0 ? decision_tree[0].id : null,
  );
  const [history, setHistory] = useState<
    { nodeId: string; choiceLabel: string; feedback: string }[]
  >([]);
  const [completed, setCompleted] = useState(false);

  const nodeMap = new Map(decision_tree.map((node) => [node.id, node]));
  const currentNode = currentNodeId ? nodeMap.get(currentNodeId) ?? null : null;

  const handleChoice = useCallback(
    (option: { label: string; next_node_id: string | null; feedback: string }) => {
      const newEntry = {
        nodeId: currentNodeId!,
        choiceLabel: option.label,
        feedback: option.feedback,
      };
      const updatedHistory = [...history, newEntry];
      setHistory(updatedHistory);

      if (option.next_node_id === null) {
        setCompleted(true);
        setCurrentNodeId(null);
        if (blockId) onComplete?.(blockId, updatedHistory);
      } else {
        setCurrentNodeId(option.next_node_id);
      }
    },
    [currentNodeId, history, blockId, onComplete],
  );

  return (
    <div className="px-4 py-4">
      {/* Scenario header */}
      <div className="bg-[var(--code-bg)] rounded-lg p-4 mb-4">
        <p className="text-sm font-medium text-[var(--text-h)] mb-2">
          Scenario
        </p>
        <p className="text-sm text-[var(--text)] leading-relaxed mb-3">
          {scenario}
        </p>

        {/* Context tags */}
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-full bg-[var(--accent-bg)] text-[var(--accent)] px-2.5 py-0.5 text-xs font-medium">
            {company_type}
          </span>
          <span className="inline-flex items-center rounded-full bg-[var(--accent-bg)] text-[var(--accent)] px-2.5 py-0.5 text-xs font-medium">
            {regulatory_body}
          </span>
        </div>
      </div>

      {/* Cultural notes aside */}
      {cultural_notes && (
        <aside className="mb-4 px-3 py-2 border-l-2 border-[var(--accent-border)] bg-[var(--social-bg)] rounded-r-lg">
          <p className="text-xs font-semibold text-[var(--text)] uppercase tracking-wide mb-1">
            Cultural Context
          </p>
          <p className="text-xs text-[var(--text)] leading-relaxed">
            {cultural_notes}
          </p>
        </aside>
      )}

      {/* Decision history */}
      {history.length > 0 && (
        <div className="mb-4 space-y-3">
          {history.map((entry, index) => (
            <div
              key={index}
              className="border border-[var(--border)] rounded-lg p-3"
            >
              <p className="text-xs font-medium text-[var(--accent)] mb-1">
                Decision {index + 1}
              </p>
              <p className="text-sm font-medium text-[var(--text-h)] mb-1">
                {entry.choiceLabel}
              </p>
              <p className="text-xs text-[var(--text)] leading-relaxed">
                {entry.feedback}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Current decision node */}
      {currentNode && !completed && (
        <div>
          <p className="text-sm text-[var(--text-h)] mb-3 leading-relaxed">
            {currentNode.text}
          </p>
          <div className="flex flex-col gap-2">
            {currentNode.options.map((option, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleChoice(option)}
                className="w-full min-h-[44px] px-4 py-3 text-left rounded-lg border border-[var(--border)] text-sm text-[var(--text-h)] hover:border-[var(--accent)] hover:bg-[var(--accent-bg)] active:bg-[var(--accent-bg)] transition-colors cursor-pointer"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Completion message */}
      {completed && (
        <div className="mt-2 p-3 rounded-lg bg-green-50 border border-green-200 text-center">
          <p className="text-sm font-medium text-green-800">
            Scenario completed
          </p>
          <p className="text-xs text-green-600 mt-1">
            You made {history.length} decision{history.length !== 1 ? 's' : ''}.
          </p>
        </div>
      )}
    </div>
  );
}
