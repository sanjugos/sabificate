// ── Assembly Review Gate: Deterministic Quality Checks ─────────────────
// Traces to: FR-8 / AC-8.1 through AC-8.6
// Pure functions that inspect a spine for quality issues before review.

import type { SpineNode, ContentBlock } from './curriculumAI.js';

// ── Interface ──────────────────────────────────────────────────────────

export interface AssemblyFlag {
  category: string;
  description: string;
  node_indices: number[];
  block_ids: string[];
}

// ── Depth tiers every node must have ───────────────────────────────────

const DEPTH_TIERS = ['foundational', 'working', 'applied'] as const;

// ── Check 1: Coverage Gap ──────────────────────────────────────────────
// Verifies each spine node has all 3 depth tiers with non-empty blocks.

export function checkCoverageGap(spine: SpineNode[]): AssemblyFlag[] {
  const flags: AssemblyFlag[] = [];

  for (const node of spine) {
    if (!node.depth_cards) {
      // All three tiers are missing
      flags.push({
        category: 'coverage_gap',
        description: `Node ${node.index} ("${node.title}") has no depth cards — all tiers (foundational, working, applied) are missing.`,
        node_indices: [node.index],
        block_ids: [],
      });
      continue;
    }

    for (const tier of DEPTH_TIERS) {
      const tierCard = node.depth_cards[tier];
      if (!tierCard || !tierCard.blocks || tierCard.blocks.length === 0) {
        flags.push({
          category: 'coverage_gap',
          description: `Node ${node.index} ("${node.title}") is missing content blocks for the ${tier} tier.`,
          node_indices: [node.index],
          block_ids: [],
        });
      }
    }
  }

  return flags;
}

// ── Check 2: Artifact Redundancy ───────────────────────────────────────
// Compares content blocks pairwise using word-level trigram overlap.
// Flags pairs with >80% trigram overlap.

function extractWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 0);
}

function buildTrigrams(words: string[]): Set<string> {
  const trigrams = new Set<string>();
  for (let i = 0; i <= words.length - 3; i++) {
    trigrams.add(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
  }
  return trigrams;
}

function trigramOverlap(textA: string, textB: string): number {
  const wordsA = extractWords(textA);
  const wordsB = extractWords(textB);

  // Need at least 3 words in both to form trigrams
  if (wordsA.length < 3 || wordsB.length < 3) return 0;

  const trigramsA = buildTrigrams(wordsA);
  const trigramsB = buildTrigrams(wordsB);

  if (trigramsA.size === 0 || trigramsB.size === 0) return 0;

  let intersection = 0;
  for (const tri of trigramsA) {
    if (trigramsB.has(tri)) {
      intersection++;
    }
  }

  // Jaccard-style overlap: intersection / min(|A|, |B|)
  // Using min ensures that a short text fully contained in a long text
  // scores high, which is the correct behavior for redundancy detection.
  const denominator = Math.min(trigramsA.size, trigramsB.size);
  return intersection / denominator;
}

function getBlockText(block: ContentBlock): string {
  // Combine all textual fields
  const parts: string[] = [];
  if (block.content) parts.push(block.content);
  if (block.question) parts.push(block.question);
  if (block.explanation) parts.push(block.explanation);
  return parts.join(' ');
}

export function checkArtifactRedundancy(spine: SpineNode[]): AssemblyFlag[] {
  const flags: AssemblyFlag[] = [];

  // Collect all content blocks with their node index
  const allBlocks: Array<{ block: ContentBlock; nodeIndex: number; text: string }> = [];

  for (const node of spine) {
    if (!node.depth_cards) continue;
    for (const tier of DEPTH_TIERS) {
      const tierCard = node.depth_cards[tier];
      if (!tierCard || !tierCard.blocks) continue;
      for (const block of tierCard.blocks) {
        const text = getBlockText(block);
        if (text.trim().length > 0) {
          allBlocks.push({ block, nodeIndex: node.index, text });
        }
      }
    }
  }

  // Pairwise comparison
  for (let i = 0; i < allBlocks.length; i++) {
    for (let j = i + 1; j < allBlocks.length; j++) {
      const overlap = trigramOverlap(allBlocks[i].text, allBlocks[j].text);
      if (overlap > 0.8) {
        const nodeIndices = Array.from(
          new Set([allBlocks[i].nodeIndex, allBlocks[j].nodeIndex]),
        );
        flags.push({
          category: 'artifact_redundancy',
          description: `Content blocks "${allBlocks[i].block.id}" and "${allBlocks[j].block.id}" have ${Math.round(overlap * 100)}% word-trigram overlap, suggesting redundant content.`,
          node_indices: nodeIndices,
          block_ids: [allBlocks[i].block.id, allBlocks[j].block.id],
        });
      }
    }
  }

  return flags;
}

// ── Combined runner ────────────────────────────────────────────────────

export function runAllAssemblyChecks(spine: SpineNode[]): AssemblyFlag[] {
  return [
    ...checkCoverageGap(spine),
    ...checkArtifactRedundancy(spine),
  ];
}
