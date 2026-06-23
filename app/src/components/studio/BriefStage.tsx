import { useState } from 'react';

interface Persona {
  slug: string;
  label: string;
  description: string;
  default_proficiency: 'foundational' | 'working' | 'applied';
  calibration_questions: Array<{
    question_text: string;
    options: string[];
    proficiency_map: Record<string, string>;
  }>;
}

interface BriefStageProps {
  track: Record<string, unknown> | null;
  onSubmitBrief: (data: { things_to_avoid: string | null; gateway_personas: Persona[] }) => void;
  loading: boolean;
}

export function BriefStage({ track, onSubmitBrief, loading }: BriefStageProps) {
  const existingPersonas = (track?.gateway_personas as Persona[]) || [];
  const [thingsToAvoid, setThingsToAvoid] = useState((track?.things_to_avoid as string) || '');
  const [personas, setPersonas] = useState<Persona[]>(
    existingPersonas.length > 0
      ? existingPersonas
      : [
          {
            slug: 'new-employee',
            label: 'New Employee',
            description: 'Recently joined the organisation, needs foundational knowledge',
            default_proficiency: 'foundational',
            calibration_questions: [
              {
                question_text: 'How familiar are you with this topic?',
                options: ['Complete beginner', 'Some basic knowledge', 'Quite familiar'],
                proficiency_map: { '0': 'foundational', '1': 'working', '2': 'applied' },
              },
            ],
          },
          {
            slug: 'experienced-professional',
            label: 'Experienced Professional',
            description: 'Several years of experience, looking for advanced knowledge',
            default_proficiency: 'working',
            calibration_questions: [
              {
                question_text: 'How do you currently apply this knowledge at work?',
                options: ['I follow instructions', 'I make decisions independently', 'I design processes and train others'],
                proficiency_map: { '0': 'foundational', '1': 'working', '2': 'applied' },
              },
            ],
          },
        ],
  );

  const handleAddPersona = () => {
    setPersonas([
      ...personas,
      {
        slug: `persona-${personas.length + 1}`,
        label: '',
        description: '',
        default_proficiency: 'foundational',
        calibration_questions: [],
      },
    ]);
  };

  const handleUpdatePersona = (idx: number, field: keyof Persona, value: unknown) => {
    setPersonas(personas.map((p, i) => (i === idx ? { ...p, [field]: value } : p)));
  };

  const handleRemovePersona = (idx: number) => {
    setPersonas(personas.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitBrief({
      things_to_avoid: thingsToAvoid || null,
      gateway_personas: personas,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Stage 4: Pre-filled Brief</h3>
        <p className="text-sm text-gray-600 mt-1">
          Define what to avoid in content generation and configure gateway personas
          with calibration questions.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Things to Avoid</label>
          <textarea
            value={thingsToAvoid}
            onChange={(e) => setThingsToAvoid(e.target.value)}
            placeholder="e.g. Avoid jargon without explanation, avoid referencing outdated 2011 Act provisions without noting they have been superseded..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700">Gateway Personas</label>
            <button
              type="button"
              onClick={handleAddPersona}
              className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              + Add Persona
            </button>
          </div>

          <div className="space-y-4">
            {personas.map((persona, idx) => (
              <div key={idx} className="border border-gray-200 rounded-md p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <span className="text-xs font-semibold text-gray-500 uppercase">Persona {idx + 1}</span>
                  {personas.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePersona(idx)}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      type="text"
                      value={persona.label}
                      onChange={(e) => handleUpdatePersona(idx, 'label', e.target.value)}
                      placeholder="Label (e.g. New Employee)"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <select
                      value={persona.default_proficiency}
                      onChange={(e) => handleUpdatePersona(idx, 'default_proficiency', e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                    >
                      <option value="foundational">Foundational</option>
                      <option value="working">Working</option>
                      <option value="applied">Applied</option>
                    </select>
                  </div>
                </div>

                <textarea
                  value={persona.description}
                  onChange={(e) => handleUpdatePersona(idx, 'description', e.target.value)}
                  placeholder="Brief description of this persona..."
                  rows={2}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                />
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || personas.length === 0}
          className="w-full py-2 px-4 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving Brief...' : 'Save Brief'}
        </button>
      </form>
    </div>
  );
}
