import React, { useEffect, useState, useCallback, useRef } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth/useAuth';
import { api } from '../../lib/api/client';

// ── Types ─────────────────────────────────────────────────────────────────

interface CalibrationQuestion {
  id: string;
  persona_id: string;
  question_text: string;
  options: string[];
  proficiency_map: Record<string, string>;
  sort_order: number;
}

interface Persona {
  id: string;
  vertical: string;
  slug: string;
  label: string;
  description: string;
  icon_svg: string | null;
  default_proficiency: string;
  default_customer_tier: string;
  sort_order: number;
  calibration_questions: CalibrationQuestion[];
}

interface PersonasResponse {
  personas: Persona[];
}

// ── Icons for each persona ────────────────────────────────────────────────

const PERSONA_ICONS: Record<string, React.JSX.Element> = {
  'new-graduate': (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
    </svg>
  ),
  'mid-career-professional': (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  ),
  'team-lead-manager': (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
    </svg>
  ),
  'senior-specialist': (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
    </svg>
  ),
};

const PERSONA_COLOR_PALETTE = [
  { border: 'border-emerald-300', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  { border: 'border-blue-300', bg: 'bg-blue-50', text: 'text-blue-700' },
  { border: 'border-purple-300', bg: 'bg-purple-50', text: 'text-purple-700' },
  { border: 'border-amber-300', bg: 'bg-amber-50', text: 'text-amber-700' },
  { border: 'border-rose-300', bg: 'bg-rose-50', text: 'text-rose-700' },
  { border: 'border-cyan-300', bg: 'bg-cyan-50', text: 'text-cyan-700' },
  { border: 'border-indigo-300', bg: 'bg-indigo-50', text: 'text-indigo-700' },
];

const PERSONA_COLORS: Record<string, { border: string; bg: string; text: string }> = {
  'new-graduate': PERSONA_COLOR_PALETTE[0],
  'mid-career-professional': PERSONA_COLOR_PALETTE[1],
  'team-lead-manager': PERSONA_COLOR_PALETTE[2],
  'senior-specialist': PERSONA_COLOR_PALETTE[3],
};

function getPersonaColors(slug: string, index: number) {
  return PERSONA_COLORS[slug] ?? PERSONA_COLOR_PALETTE[index % PERSONA_COLOR_PALETTE.length];
}

const TIER_DESCRIPTIONS: Record<string, { title: string; description: string }> = {
  foundational: {
    title: 'Foundational',
    description: 'You will start with the essentials -- clear explanations, guided examples, and quizzes that build your confidence from the ground up.',
  },
  working: {
    title: 'Working',
    description: 'You will get practical, job-relevant content -- real-world scenarios, intermediate assessments, and case studies drawn from Nigerian professional practice.',
  },
  applied: {
    title: 'Applied',
    description: 'You will tackle advanced material -- regulatory deep-dives, complex case analysis, and assessments aligned with professional certification standards.',
  },
};

const DEFAULT_VERTICAL = 'financial-literacy';

// ── Component ─────────────────────────────────────────────────────────────

export default function Onboarding() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [screen, setScreen] = useState<1 | 2 | 3>(1);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [resolvedTier, setResolvedTier] = useState<string>('foundational');
  const [resolvedCustomerTier, setResolvedCustomerTier] = useState<string>('freemium');
  const [manualOverride, setManualOverride] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingPersonas, setLoadingPersonas] = useState(true);

  // Fetch personas on mount
  useEffect(() => {
    api.get<PersonasResponse>(`/personas?vertical=${DEFAULT_VERTICAL}`)
      .then((res) => setPersonas(res.personas))
      .catch(() => {})
      .finally(() => setLoadingPersonas(false));
  }, []);

  // When a persona is selected and user moves to screen 2, pre-set the default tier
  const handlePersonaSelect = useCallback((persona: Persona) => {
    flushSync(() => {
      setSelectedPersona(persona);
      setSelectedOption(null);
      setResolvedTier(persona.default_proficiency);
      setResolvedCustomerTier(persona.default_customer_tier);
      setScreen(2);
    });
  }, []);

  // When calibration answer is selected, resolve the tier
  const handleCalibrationAnswer = useCallback((optionIndex: number) => {
    flushSync(() => {
      setSelectedOption(optionIndex);
      if (selectedPersona && selectedPersona.calibration_questions.length > 0) {
        const q = selectedPersona.calibration_questions[0];
        const mapped = q.proficiency_map[String(optionIndex)];
        if (mapped) {
          setResolvedTier(mapped);
        }
      }
    });
  }, [selectedPersona]);

  const handleContinueToResult = useCallback(() => {
    flushSync(() => { setScreen(3); });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selectedPersona) return;
    setSubmitting(true);

    const question = selectedPersona.calibration_questions[0];

    try {
      await api.post('/learner/persona', {
        vertical: DEFAULT_VERTICAL,
        persona_slug: selectedPersona.slug,
        proficiency_level: resolvedTier,
        customer_tier: resolvedCustomerTier,
        ...(question && selectedOption !== null
          ? { calibration_answer: { question_id: question.id, selected_option: selectedOption } }
          : {}),
      });
      navigate('/', { replace: true });
    } catch {
      // If save fails, still navigate -- the user can retry later
      navigate('/', { replace: true });
    }
  }, [selectedPersona, resolvedTier, resolvedCustomerTier, selectedOption, navigate]);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function handleNativeClick(e: MouseEvent) {
      const target = e.target as HTMLElement;

      const personaBtn = target.closest<HTMLButtonElement>('[data-persona-slug]');
      if (personaBtn) {
        const slug = personaBtn.getAttribute('data-persona-slug');
        const p = personas.find(pp => pp.slug === slug);
        if (p) handlePersonaSelect(p);
        return;
      }

      const calBtn = target.closest<HTMLButtonElement>('[data-calibration-index]');
      if (calBtn) {
        handleCalibrationAnswer(Number(calBtn.getAttribute('data-calibration-index')));
        return;
      }

      const actionBtn = target.closest<HTMLButtonElement>('[data-action]');
      if (actionBtn) {
        const action = actionBtn.getAttribute('data-action');
        if (action === 'continue-to-result') handleContinueToResult();
        else if (action === 'submit-onboarding') handleSubmit();
        else if (action === 'back') flushSync(() => setScreen(1));
        else if (action === 'toggle-override') flushSync(() => setManualOverride(true));
      }

      const tierBtn = target.closest<HTMLButtonElement>('[data-tier]');
      if (tierBtn) {
        flushSync(() => setResolvedTier(tierBtn.getAttribute('data-tier')!));
      }
    }

    el.addEventListener('click', handleNativeClick);
    return () => el.removeEventListener('click', handleNativeClick);
  }, [personas, handlePersonaSelect, handleCalibrationAnswer, handleContinueToResult, handleSubmit]);

  // Auth guard
  if (authLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login?redirect=/onboarding" replace />;

  return (
    <div ref={containerRef} className="min-h-svh bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="text-lg font-bold text-blue-700">SABIficate</h1>
          <div className="flex gap-1.5">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`h-1.5 w-8 rounded-full transition-colors ${
                  step <= screen ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Screen 1: Persona selection */}
        {screen === 1 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Which sounds like you?</h2>
            <p className="text-sm text-gray-500 mb-6">
              This helps us tailor your learning path. You can change this later.
            </p>

            {loadingPersonas ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-24 rounded-xl bg-gray-100 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {personas.map((persona, i) => {
                  const colors = getPersonaColors(persona.slug, i);
                  return (
                    <button
                      key={persona.slug}
                      data-persona-slug={persona.slug}
                      onClick={() => handlePersonaSelect(persona)}
                      className={`w-full text-left rounded-xl border-2 ${colors.border} ${colors.bg} p-4 transition-shadow hover:shadow-md active:shadow-sm`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 ${colors.text} shrink-0`}>
                          {PERSONA_ICONS[persona.slug] ?? (
                            <div className="w-8 h-8 rounded-full bg-gray-200" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-900 text-sm">{persona.label}</h3>
                          <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{persona.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Screen 2: Calibration question */}
        {screen === 2 && selectedPersona && (
          <div>
            <button
              data-action="back"
              onClick={() => flushSync(() => setScreen(1))}
              className="text-sm text-blue-700 font-medium mb-4 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              Back
            </button>

            <h2 className="text-xl font-bold text-gray-900 mb-1">Quick check</h2>
            <p className="text-sm text-gray-500 mb-6">
              One question to find the right starting point for you.
            </p>

            {selectedPersona.calibration_questions.length > 0 ? (
              <div>
                <p className="font-medium text-gray-900 text-sm mb-4">
                  {selectedPersona.calibration_questions[0].question_text}
                </p>

                <div className="space-y-2">
                  {(selectedPersona.calibration_questions[0].options as string[]).map((option, index) => (
                    <button
                      key={index}
                      data-calibration-index={index}
                      onClick={() => flushSync(() => handleCalibrationAnswer(index))}
                      className={`w-full text-left rounded-lg border-2 px-4 py-3 text-sm transition-colors ${
                        selectedOption === index
                          ? 'border-blue-600 bg-blue-50 text-blue-900'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${
                          selectedOption === index ? 'border-blue-600' : 'border-gray-300'
                        }`}>
                          {selectedOption === index && (
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                          )}
                        </div>
                        {option}
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  data-action="continue-to-result"
                  onClick={handleContinueToResult}
                  disabled={selectedOption === null}
                  className="w-full mt-6 rounded-lg bg-blue-700 px-4 py-3 text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                >
                  Continue
                </button>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-500 mb-4">No calibration question available. We will use the default level for your profile.</p>
                <button
                  data-action="continue-to-result"
                  onClick={handleContinueToResult}
                  className="w-full rounded-lg bg-blue-700 px-4 py-3 text-sm font-semibold text-white"
                >
                  Continue
                </button>
              </div>
            )}
          </div>
        )}

        {/* Screen 3: Result / tier display */}
        {screen === 3 && selectedPersona && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Your learning path</h2>
            <p className="text-sm text-gray-500 mb-6">
              Based on your answers, here is where you will start.
            </p>

            <div className="rounded-xl border-2 border-blue-200 bg-white p-6 text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 text-blue-700 mb-3">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                {TIER_DESCRIPTIONS[resolvedTier]?.title ?? resolvedTier}
              </h3>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                {TIER_DESCRIPTIONS[resolvedTier]?.description ?? ''}
              </p>
            </div>

            {!manualOverride ? (
              <button
                data-action="toggle-override"
                onClick={() => flushSync(() => setManualOverride(true))}
                className="block mx-auto text-sm text-gray-500 underline underline-offset-2 mb-6"
              >
                Change my level
              </button>
            ) : (
              <div className="mb-6 space-y-2">
                {Object.entries(TIER_DESCRIPTIONS).map(([key, tier]) => (
                  <button
                    key={key}
                    data-tier={key}
                    onClick={() => flushSync(() => setResolvedTier(key))}
                    className={`w-full text-left rounded-lg border-2 px-4 py-3 text-sm transition-colors ${
                      resolvedTier === key
                        ? 'border-blue-600 bg-blue-50 text-blue-900'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="font-semibold">{tier.title}</span>
                  </button>
                ))}
              </div>
            )}

            <button
              data-action="submit-onboarding"
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full rounded-lg bg-blue-700 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60 transition-opacity"
            >
              {submitting ? 'Saving...' : 'Continue to Dashboard'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
