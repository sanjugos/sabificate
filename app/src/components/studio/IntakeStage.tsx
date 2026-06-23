import { useState } from 'react';

interface IntakeStageProps {
  track: Record<string, unknown> | null;
  onSubmitIntake: (data: {
    skill_statement: string;
    target_learner_role: string;
    context_mode: string;
  }) => void;
  loading: boolean;
}

export function IntakeStage({ track, onSubmitIntake, loading }: IntakeStageProps) {
  const [skillStatement, setSkillStatement] = useState((track?.skill_statement as string) || '');
  const [targetRole, setTargetRole] = useState((track?.target_learner_role as string) || '');
  const [contextMode, setContextMode] = useState((track?.context_mode as string) || 'nigerian');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitIntake({
      skill_statement: skillStatement,
      target_learner_role: targetRole,
      context_mode: contextMode,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Stage 2: Skill Intake</h3>
        <p className="text-sm text-gray-600 mt-1">
          Define what the learner should be able to do after completing this track.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Skill Statement</label>
          <textarea
            value={skillStatement}
            onChange={(e) => setSkillStatement(e.target.value)}
            placeholder="e.g. Apply AML compliance procedures including KYC verification, transaction monitoring, and STR filing in a Nigerian banking context."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Describe the competency the learner will gain. Be specific about context and measurable outcomes.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Target Learner Role</label>
          <input
            type="text"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="e.g. Branch Operations Officer, Compliance Analyst"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Context Mode</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="contextMode"
                value="nigerian"
                checked={contextMode === 'nigerian'}
                onChange={() => setContextMode('nigerian')}
                className="text-blue-600"
              />
              <span className="text-sm">Nigerian Context</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="contextMode"
                value="generic"
                checked={contextMode === 'generic'}
                onChange={() => setContextMode('generic')}
                className="text-blue-600"
              />
              <span className="text-sm">Generic / International</span>
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-1">Nigerian context uses local regulations, currency, and examples.</p>
        </div>

        <button
          type="submit"
          disabled={loading || !skillStatement.trim() || !targetRole.trim()}
          className="w-full py-2 px-4 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Submitting...' : 'Submit Skill Intake'}
        </button>
      </form>
    </div>
  );
}
