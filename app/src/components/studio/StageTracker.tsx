const STAGES = [
  { key: 'setup', label: '1. Setup', status: 'draft' },
  { key: 'intake', label: '2. Intake', status: 'intake' },
  { key: 'decompose', label: '3. Decompose', status: 'decomposition' },
  { key: 'brief', label: '4. Brief', status: 'briefing' },
  { key: 'generate', label: '5. Generate', status: 'generation' },
  { key: 'review', label: '6. Review', status: 'review' },
  { key: 'publish', label: '7. Publish', status: 'published' },
] as const;

const STATUS_ORDER: Record<string, number> = {
  draft: 0,
  intake: 1,
  decomposition: 2,
  briefing: 3,
  generation: 4,
  review: 5,
  published: 6,
};

interface StageTrackerProps {
  currentStatus: string;
  activeStage: number;
  onStageClick: (stageIndex: number) => void;
}

export function StageTracker({ currentStatus, activeStage, onStageClick }: StageTrackerProps) {
  const currentOrder = STATUS_ORDER[currentStatus] ?? 0;

  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex items-center min-w-[640px] gap-1">
        {STAGES.map((stage, idx) => {
          const stageOrder = STATUS_ORDER[stage.status] ?? idx;
          const isCompleted = stageOrder < currentOrder;
          const isCurrent = stageOrder === currentOrder;
          const isActive = idx === activeStage;

          let bgClass = 'bg-gray-100 text-gray-500';
          if (isCompleted) bgClass = 'bg-green-100 text-green-800';
          if (isCurrent) bgClass = 'bg-blue-100 text-blue-800';
          if (isActive) bgClass += ' ring-2 ring-blue-500';

          return (
            <button
              key={stage.key}
              onClick={() => onStageClick(idx)}
              className={`flex-1 px-2 py-2 rounded-md text-xs font-medium transition-all ${bgClass} hover:opacity-80`}
            >
              <div className="text-center">
                <span className="block truncate">{stage.label}</span>
                {isCompleted && <span className="block text-[10px] mt-0.5">Done</span>}
                {isCurrent && <span className="block text-[10px] mt-0.5">Current</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
