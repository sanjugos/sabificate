/**
 * Shared utilities for the AI content pipeline agents.
 * - Anthropic client singleton
 * - Retry with exponential backoff
 * - Token / cost tracking
 * - JSON extraction from Claude responses
 */
import Anthropic from '@anthropic-ai/sdk';

// ── Constants ────────────────────────────────────────────────────────

/** Model used by every pipeline agent. */
export const MODEL_ID = 'claude-sonnet-4-6' as const;

/** Pricing per 1 million tokens (USD). */
const INPUT_COST_PER_M = 3.0;
const OUTPUT_COST_PER_M = 15.0;

/** Default retry configuration. */
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1_000;

// ── Anthropic Client ─────────────────────────────────────────────────

let _client: Anthropic | null = null;

/**
 * Returns a shared Anthropic client instance.
 * Reads ANTHROPIC_API_KEY from the environment.
 */
export function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic();
  }
  return _client;
}

// ── Cost Tracking ────────────────────────────────────────────────────

export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
}

export interface StageResult<T> {
  data: T;
  usage: TokenUsage;
  cost_usd: number;
  stage: string;
  duration_ms: number;
}

export interface PipelineRunSummary {
  stages: StageResult<unknown>[];
  total_input_tokens: number;
  total_output_tokens: number;
  total_cost_usd: number;
  total_duration_ms: number;
}

export function computeCost(usage: TokenUsage): number {
  return (
    (usage.input_tokens / 1_000_000) * INPUT_COST_PER_M +
    (usage.output_tokens / 1_000_000) * OUTPUT_COST_PER_M
  );
}

export function summariseRun(stages: StageResult<unknown>[]): PipelineRunSummary {
  let totalIn = 0;
  let totalOut = 0;
  let totalCost = 0;
  let totalDuration = 0;
  for (const s of stages) {
    totalIn += s.usage.input_tokens;
    totalOut += s.usage.output_tokens;
    totalCost += s.cost_usd;
    totalDuration += s.duration_ms;
  }
  return {
    stages,
    total_input_tokens: totalIn,
    total_output_tokens: totalOut,
    total_cost_usd: totalCost,
    total_duration_ms: totalDuration,
  };
}

// ── Retry Logic ──────────────────────────────────────────────────────

/**
 * Calls `fn` up to `maxRetries` times with exponential backoff.
 * Only retries on Anthropic rate-limit (429) and server errors (5xx).
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      const isRetryable =
        err instanceof Anthropic.RateLimitError ||
        (err instanceof Anthropic.APIError && err.status >= 500);
      if (!isRetryable || attempt === maxRetries - 1) {
        throw err;
      }
      const delay = BASE_DELAY_MS * Math.pow(2, attempt);
      await sleep(delay);
    }
  }
  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── JSON Extraction ──────────────────────────────────────────────────

/**
 * Extracts the first JSON object or array from a Claude text response.
 * Handles responses wrapped in markdown code fences.
 */
export function extractJson(text: string): unknown {
  // Try to find JSON inside code fences first
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  const candidate = fenceMatch ? fenceMatch[1]!.trim() : text.trim();

  // Find the first { or [ and parse from there
  const startObj = candidate.indexOf('{');
  const startArr = candidate.indexOf('[');
  let start: number;

  if (startObj === -1 && startArr === -1) {
    throw new Error('No JSON object or array found in response');
  } else if (startObj === -1) {
    start = startArr;
  } else if (startArr === -1) {
    start = startObj;
  } else {
    start = Math.min(startObj, startArr);
  }

  const sub = candidate.slice(start);
  try {
    return JSON.parse(sub);
  } catch {
    // If the direct parse fails, try to find the matching closing bracket
    const openChar = sub[0];
    const closeChar = openChar === '{' ? '}' : ']';
    let depth = 0;
    let inString = false;
    let escape = false;
    for (let i = 0; i < sub.length; i++) {
      const ch = sub[i]!;
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === '\\') {
        escape = true;
        continue;
      }
      if (ch === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;
      if (ch === openChar) depth++;
      if (ch === closeChar) depth--;
      if (depth === 0) {
        return JSON.parse(sub.slice(0, i + 1));
      }
    }
    throw new Error('Could not extract valid JSON from response');
  }
}

// ── Response text helper ─────────────────────────────────────────────

/**
 * Extracts the concatenated text content from a Claude Message response.
 */
export function getResponseText(response: Anthropic.Message): string {
  const parts: string[] = [];
  for (const block of response.content) {
    if (block.type === 'text') {
      parts.push(block.text);
    }
  }
  return parts.join('');
}
