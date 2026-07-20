// ── Track Template Seed Data ─────────────────────────────────────────────
//
// 10 representative templates from the Gbitse 238-course catalogue.
// The full 238 will be seeded from corpus/catalog/course-catalogue-v1.md
// in a future migration task.
//
// Each template pre-populates the Setup + Intake stages so authors
// can start from a known-good configuration instead of blank.

export interface TrackTemplate {
  id: string;
  name: string;
  vertical: 'financial-literacy' | 'banking-compliance' | 'insurance' | 'fintech' | 'professional-development';
  domain: string;
  customer_tier: 'freemium' | 'hiring' | 'upskilling' | 'premium';
  tier_treatment: 'A' | 'B' | 'C';
  credential_type: 'completion_badge' | 'verified_certificate' | 'team_record' | 'professional_certificate';
  paywall_lesson_index: number;
  skill_statement: string;
  target_learner_role: string;
  context_mode: 'nigerian' | 'generic';
}

export const TRACK_TEMPLATES: TrackTemplate[] = [
  {
    id: 'tpl-001',
    name: 'Self-Awareness in the Moment',
    vertical: 'professional-development',
    domain: 'Emotional Intelligence & Self-Awareness',
    customer_tier: 'freemium',
    tier_treatment: 'A',
    credential_type: 'completion_badge',
    paywall_lesson_index: 2,
    skill_statement:
      'Learner can pause in real time, name the emotion driving their behaviour, and choose a deliberate response instead of a reactive one.',
    target_learner_role: 'Individual contributor or new manager',
    context_mode: 'nigerian',
  },
  {
    id: 'tpl-002',
    name: 'Discovery — The Sales Conversation That Earns Trust',
    vertical: 'professional-development',
    domain: 'Sales Craft',
    customer_tier: 'hiring',
    tier_treatment: 'B',
    credential_type: 'verified_certificate',
    paywall_lesson_index: 2,
    skill_statement:
      'Learner can run a structured discovery conversation that surfaces the real need, builds trust, and qualifies the opportunity.',
    target_learner_role: 'Sales executive or relationship manager',
    context_mode: 'nigerian',
  },
  {
    id: 'tpl-003',
    name: 'De-escalation — Turning Heat into Resolution',
    vertical: 'professional-development',
    domain: 'Customer Service & Recovery',
    customer_tier: 'upskilling',
    tier_treatment: 'A',
    credential_type: 'completion_badge',
    paywall_lesson_index: 3,
    skill_statement:
      'Learner can lower emotional intensity in an angry customer interaction and pivot to collaborative problem-solving.',
    target_learner_role: 'Customer service agent or branch staff',
    context_mode: 'nigerian',
  },
  {
    id: 'tpl-004',
    name: 'Giving Feedback That Lands',
    vertical: 'professional-development',
    domain: 'Difficult Conversations & Feedback',
    customer_tier: 'upskilling',
    tier_treatment: 'B',
    credential_type: 'verified_certificate',
    paywall_lesson_index: 2,
    skill_statement:
      'Learner can deliver critical feedback in a way that the recipient hears, accepts, and acts on without damaging the relationship.',
    target_learner_role: 'Manager or team lead',
    context_mode: 'nigerian',
  },
  {
    id: 'tpl-005',
    name: 'Negotiation Without Authority',
    vertical: 'professional-development',
    domain: 'Negotiation & Influence',
    customer_tier: 'hiring',
    tier_treatment: 'B',
    credential_type: 'verified_certificate',
    paywall_lesson_index: 2,
    skill_statement:
      'Learner can influence outcomes in situations where they have no formal power, using principled negotiation techniques.',
    target_learner_role: 'Mid-level professional or project lead',
    context_mode: 'nigerian',
  },
  {
    id: 'tpl-006',
    name: 'AML/KYC Compliance for Branch Staff',
    vertical: 'banking-compliance',
    domain: 'Banking Compliance',
    customer_tier: 'upskilling',
    tier_treatment: 'A',
    credential_type: 'professional_certificate',
    paywall_lesson_index: 1,
    skill_statement:
      'Learner can identify suspicious transactions, apply KYC due diligence procedures, and file SARs in compliance with CBN regulations.',
    target_learner_role: 'Bank branch operations staff',
    context_mode: 'nigerian',
  },
  {
    id: 'tpl-007',
    name: 'Framing the Right Problem',
    vertical: 'professional-development',
    domain: 'Problem Framing & Judgment',
    customer_tier: 'premium',
    tier_treatment: 'C',
    credential_type: 'verified_certificate',
    paywall_lesson_index: 2,
    skill_statement:
      'Learner can reframe an ambiguous situation into a well-defined problem statement before jumping to solutions.',
    target_learner_role: 'Senior professional or consultant',
    context_mode: 'generic',
  },
  {
    id: 'tpl-008',
    name: 'Coaching for Performance',
    vertical: 'professional-development',
    domain: 'Coaching & Developing Others',
    customer_tier: 'upskilling',
    tier_treatment: 'B',
    credential_type: 'verified_certificate',
    paywall_lesson_index: 2,
    skill_statement:
      'Learner can conduct a structured coaching conversation using the GROW model that moves a direct report from stuck to action.',
    target_learner_role: 'People manager',
    context_mode: 'nigerian',
  },
  {
    id: 'tpl-009',
    name: 'Delegating to AI Effectively',
    vertical: 'fintech',
    domain: 'Working with AI',
    customer_tier: 'freemium',
    tier_treatment: 'A',
    credential_type: 'completion_badge',
    paywall_lesson_index: 3,
    skill_statement:
      'Learner can break a knowledge task into subtasks, delegate the right parts to AI tools, and verify the output quality.',
    target_learner_role: 'Any knowledge worker',
    context_mode: 'generic',
  },
  {
    id: 'tpl-010',
    name: 'Insurance Claims Investigation Fundamentals',
    vertical: 'insurance',
    domain: 'Insurance Operations',
    customer_tier: 'upskilling',
    tier_treatment: 'A',
    credential_type: 'professional_certificate',
    paywall_lesson_index: 2,
    skill_statement:
      'Learner can conduct a structured claims investigation, gather relevant evidence, and make a fair and defensible settlement recommendation.',
    target_learner_role: 'Claims officer or underwriter',
    context_mode: 'nigerian',
  },
];
