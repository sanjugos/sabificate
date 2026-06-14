// ── WhatsApp Template Definitions ───────────────────────────────────────────
// Pre-defined templates for Meta Business API approval.
// These are submitted to Meta for review; once approved, they can be sent
// via the sendTemplate() function in client.ts.

export interface TemplateButtonConfig {
  type: 'URL' | 'QUICK_REPLY';
  text: string;
  url?: string; // For URL buttons; {{1}} placeholder allowed
}

export interface WhatsAppTemplate {
  name: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  language: string;
  body_template: string;
  button_config: TemplateButtonConfig[];
}

// ── Template Registry ───────────────────────────────────────────────────────

export const TEMPLATES: Record<string, WhatsAppTemplate> = {
  lesson_reminder: {
    name: 'lesson_reminder',
    category: 'UTILITY',
    language: 'en',
    body_template:
      'Your next SABIficate lesson is ready: {{1}} - {{2}}',
    button_config: [
      {
        type: 'URL',
        text: 'Start lesson',
        url: 'https://app.sabificate.com/lessons/{{1}}',
      },
    ],
  },

  streak_reminder: {
    name: 'streak_reminder',
    category: 'MARKETING',
    language: 'en',
    body_template:
      'Keep your streak! You have {{1}} days. Continue learning: {{2}}',
    button_config: [
      {
        type: 'URL',
        text: 'Continue',
        url: '{{1}}',
      },
    ],
  },

  payment_failed_24h: {
    name: 'payment_failed_24h',
    category: 'UTILITY',
    language: 'en',
    body_template:
      "Payment for your SABIficate subscription couldn't be processed. Update your payment method: {{1}}",
    button_config: [
      {
        type: 'URL',
        text: 'Update payment',
        url: '{{1}}',
      },
    ],
  },

  payment_failed_72h: {
    name: 'payment_failed_72h',
    category: 'UTILITY',
    language: 'en',
    body_template:
      'Action required: Your SABIficate access will be limited in 4 days. Update payment: {{1}}',
    button_config: [
      {
        type: 'URL',
        text: 'Update payment',
        url: '{{1}}',
      },
    ],
  },

  payment_failed_7d: {
    name: 'payment_failed_7d',
    category: 'UTILITY',
    language: 'en',
    body_template:
      'Last notice: Your SABIficate subscription is about to expire. Update now: {{1}}',
    button_config: [
      {
        type: 'URL',
        text: 'Update now',
        url: '{{1}}',
      },
    ],
  },

  credential_earned: {
    name: 'credential_earned',
    category: 'UTILITY',
    language: 'en',
    body_template:
      'Congratulations! You earned your SABIficate credential: {{1}}. View: {{2}}',
    button_config: [
      {
        type: 'URL',
        text: 'View credential',
        url: '{{1}}',
      },
    ],
  },
} as const;

// ── Helper ──────────────────────────────────────────────────────────────────

export function getTemplate(name: string): WhatsAppTemplate | undefined {
  return TEMPLATES[name];
}

export function getAllTemplateNames(): string[] {
  return Object.keys(TEMPLATES);
}
