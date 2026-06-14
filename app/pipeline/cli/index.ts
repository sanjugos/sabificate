#!/usr/bin/env node
/**
 * SABIficate AI Content Pipeline — CLI Entry Point
 *
 * Commands:
 *   generate <brief.json>   — Run the full 5-stage pipeline on an SME brief
 *   validate <package.json> — Validate an existing lesson package
 *   template                — Print an example SME brief to stdout
 *
 * Usage:
 *   npx tsx pipeline/cli/index.ts generate brief.json
 *   npx tsx pipeline/cli/index.ts validate output/lesson-001.json
 *   npx tsx pipeline/cli/index.ts template > my-brief.json
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { CourseBriefSchema, type CourseBrief } from '../schemas/briefSchema.ts';
import { ContentBlockSchema } from '../schemas/contentSchema.ts';
import type { ContentBlockZ } from '../schemas/contentSchema.ts';
import { generateLesson } from '../agents/lessonGenerator.ts';
import { generateQuiz } from '../agents/quizGenerator.ts';
import { generateAdaptiveVariants } from '../agents/adaptiveVariantGenerator.ts';
import { generateArtifactPrompts } from '../agents/artifactPromptGenerator.ts';
import { validateLessonPackage, type ValidationReport } from '../agents/validationAgent.ts';
import { summariseRun, type StageResult, type PipelineRunSummary } from '../agents/shared.ts';
import { briefTemplateJson } from './briefTemplate.ts';
import { z } from 'zod';

// ── Types ────────────────────────────────────────────────────────────

interface LessonPackage {
  lessonId: string;
  lessonTitle: string;
  moduleTitle: string;
  moduleIndex: number;
  lessonIndex: number;
  blocks: ContentBlockZ[];
  variants: {
    difficulty_tier: string;
    blocks: ContentBlockZ[];
  }[];
  validation: ValidationReport;
}

interface PipelineOutput {
  course: CourseBrief;
  lessons: LessonPackage[];
  summary: PipelineRunSummary;
}

// ── ID generators ────────────────────────────────────────────────────

function lessonIdFromIndices(moduleIdx: number, lessonIdx: number): string {
  const m = String(moduleIdx + 1).padStart(2, '0');
  const l = String(lessonIdx + 1).padStart(2, '0');
  return `lesson-${m}-${l}`;
}

// ── Core pipeline ────────────────────────────────────────────────────

async function runPipeline(brief: CourseBrief): Promise<PipelineOutput> {
  const allStages: StageResult<unknown>[] = [];
  const lessons: LessonPackage[] = [];

  console.log(`\n=== SABIficate AI Content Pipeline ===`);
  console.log(`Course: ${brief.title}`);
  console.log(`Modules: ${brief.modules.length}`);

  const totalLessons = brief.modules.reduce(
    (sum, m) => sum + m.lessons.length,
    0,
  );
  console.log(`Total lessons: ${totalLessons}\n`);

  let lessonCounter = 0;

  for (let mi = 0; mi < brief.modules.length; mi++) {
    const mod = brief.modules[mi]!;
    console.log(`--- Module ${mi + 1}: ${mod.title} ---`);

    for (let li = 0; li < mod.lessons.length; li++) {
      const lesson = mod.lessons[li]!;
      const lessonId = lessonIdFromIndices(mi, li);
      lessonCounter++;

      console.log(
        `\n  [${lessonCounter}/${totalLessons}] ${lesson.title}`,
      );

      const courseContext = {
        title: brief.title,
        category: brief.category,
        difficulty_level: brief.difficulty_level,
        professional_body: brief.professional_body,
        industry_vertical: brief.industry_vertical,
        target_career_level: brief.target_career_level,
        additional_context: brief.additional_context,
      };

      // ── Stage 1: Lesson Generation ──
      console.log('    Stage 1/5: Generating lesson content...');
      const lessonResult = await generateLesson({
        lesson,
        moduleTitle: mod.title,
        courseContext,
        lessonId,
        sortIndex: li,
      });
      allStages.push(lessonResult);
      console.log(
        `    -> ${lessonResult.data.blocks.length} text blocks ` +
          `($${lessonResult.cost_usd.toFixed(4)})`,
      );

      // ── Stage 2: Quiz Generation ──
      console.log('    Stage 2/5: Generating quiz questions...');
      const quizResult = await generateQuiz({
        textBlocks: lessonResult.data.blocks,
        lesson,
        courseContext,
        lessonId,
      });
      allStages.push(quizResult);
      console.log(
        `    -> ${quizResult.data.quiz_blocks.length} quiz blocks ` +
          `($${quizResult.cost_usd.toFixed(4)})`,
      );

      // ── Stage 3: Adaptive Variants ──
      console.log('    Stage 3/5: Generating difficulty variants...');
      const variantResult = await generateAdaptiveVariants({
        baselineTextBlocks: lessonResult.data.blocks,
        baselineQuizBlocks: quizResult.data.quiz_blocks,
        baselineDifficulty: brief.difficulty_level,
        lesson,
        courseContext,
        lessonId,
      });
      allStages.push(variantResult);
      console.log(
        `    -> ${variantResult.data.variants.length} variants ` +
          `($${variantResult.cost_usd.toFixed(4)})`,
      );

      // ── Stage 4: Artifact Prompts (conditional) ──
      let artifactBlocks: ContentBlockZ[] = [];
      if (lesson.include_artifact) {
        console.log('    Stage 4/5: Generating artifact prompts...');
        const artifactResult = await generateArtifactPrompts({
          textBlocks: lessonResult.data.blocks,
          quizBlocks: quizResult.data.quiz_blocks,
          lesson,
          courseContext,
          lessonId,
        });
        allStages.push(artifactResult);
        artifactBlocks = artifactResult.data.artifact_prompt_blocks;
        console.log(
          `    -> ${artifactBlocks.length} artifact prompts ` +
            `($${artifactResult.cost_usd.toFixed(4)})`,
        );
      } else {
        console.log('    Stage 4/5: Skipped (no artifact requested)');
      }

      // ── Assemble baseline blocks ──
      const baselineBlocks: ContentBlockZ[] = [
        ...lessonResult.data.blocks,
        ...quizResult.data.quiz_blocks,
        ...artifactBlocks,
      ];

      // ── Stage 5: Validation ──
      console.log('    Stage 5/5: Validating lesson package...');
      const validation = validateLessonPackage({
        lessonId,
        lessonTitle: lesson.title,
        blocks: baselineBlocks,
      });

      const statusIcon = validation.passed ? 'PASS' : 'FAIL';
      console.log(
        `    -> ${statusIcon} (score: ${validation.score}/100, ` +
          `${validation.issues.length} issues)`,
      );

      if (validation.issues.length > 0) {
        for (const issue of validation.issues) {
          const prefix = issue.severity === 'error' ? 'ERROR' : 'WARN';
          console.log(
            `       [${prefix}] ${issue.category}: ${issue.message}`,
          );
        }
      }

      // ── Build variant block lists ──
      const variants = variantResult.data.variants.map((v) => ({
        difficulty_tier: v.difficulty_tier,
        blocks: [...v.text_blocks, ...v.quiz_blocks] as ContentBlockZ[],
      }));

      lessons.push({
        lessonId,
        lessonTitle: lesson.title,
        moduleTitle: mod.title,
        moduleIndex: mi,
        lessonIndex: li,
        blocks: baselineBlocks,
        variants,
        validation,
      });
    }
  }

  const summary = summariseRun(allStages);

  console.log('\n=== Pipeline Complete ===');
  console.log(`Total tokens: ${summary.total_input_tokens} in / ${summary.total_output_tokens} out`);
  console.log(`Total cost: $${summary.total_cost_usd.toFixed(4)}`);
  console.log(`Total time: ${(summary.total_duration_ms / 1000).toFixed(1)}s`);

  const passedCount = lessons.filter((l) => l.validation.passed).length;
  console.log(`Validation: ${passedCount}/${lessons.length} lessons passed\n`);

  return { course: brief, lessons, summary };
}

// ── CLI Commands ─────────────────────────────────────────────────────

async function commandGenerate(briefPath: string): Promise<void> {
  const absPath = resolve(briefPath);
  console.log(`Reading brief from: ${absPath}`);

  let rawJson: string;
  try {
    rawJson = await readFile(absPath, 'utf-8');
  } catch {
    console.error(`Error: Could not read file ${absPath}`);
    process.exit(1);
  }

  let briefData: unknown;
  try {
    briefData = JSON.parse(rawJson);
  } catch {
    console.error('Error: File is not valid JSON');
    process.exit(1);
  }

  const parseResult = CourseBriefSchema.safeParse(briefData);
  if (!parseResult.success) {
    console.error('Error: Brief does not match expected schema:');
    for (const issue of parseResult.error.issues) {
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exit(1);
  }

  const brief = parseResult.data;
  const output = await runPipeline(brief);

  // Write output
  const outDir = resolve('pipeline-output', brief.slug);
  await mkdir(outDir, { recursive: true });

  // Write each lesson package
  for (const lesson of output.lessons) {
    const filename = `${lesson.lessonId}.json`;
    await writeFile(
      join(outDir, filename),
      JSON.stringify(lesson, null, 2),
      'utf-8',
    );
  }

  // Write summary
  await writeFile(
    join(outDir, 'pipeline-summary.json'),
    JSON.stringify(
      {
        course_title: brief.title,
        course_slug: brief.slug,
        generated_at: new Date().toISOString(),
        total_lessons: output.lessons.length,
        passed_validation: output.lessons.filter((l) => l.validation.passed)
          .length,
        total_cost_usd: output.summary.total_cost_usd,
        total_tokens: {
          input: output.summary.total_input_tokens,
          output: output.summary.total_output_tokens,
        },
        total_duration_ms: output.summary.total_duration_ms,
      },
      null,
      2,
    ),
    'utf-8',
  );

  console.log(`Output written to: ${outDir}/`);
}

async function commandValidate(packagePath: string): Promise<void> {
  const absPath = resolve(packagePath);
  console.log(`Validating package: ${absPath}`);

  let rawJson: string;
  try {
    rawJson = await readFile(absPath, 'utf-8');
  } catch {
    console.error(`Error: Could not read file ${absPath}`);
    process.exit(1);
  }

  let packageData: unknown;
  try {
    packageData = JSON.parse(rawJson);
  } catch {
    console.error('Error: File is not valid JSON');
    process.exit(1);
  }

  // Validate that it looks like a lesson package
  const PackageShape = z.object({
    lessonId: z.string(),
    lessonTitle: z.string(),
    blocks: z.array(ContentBlockSchema),
  });

  const parseResult = PackageShape.safeParse(packageData);
  if (!parseResult.success) {
    console.error('Error: File does not look like a lesson package:');
    for (const issue of parseResult.error.issues) {
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exit(1);
  }

  const report = validateLessonPackage({
    lessonId: parseResult.data.lessonId,
    lessonTitle: parseResult.data.lessonTitle,
    blocks: parseResult.data.blocks,
  });

  console.log(`\nValidation Report: ${report.lessonTitle}`);
  console.log(`Status: ${report.passed ? 'PASSED' : 'FAILED'}`);
  console.log(`Score: ${report.score}/100`);
  console.log(`\nStats:`);
  console.log(`  Text blocks: ${report.stats.text_block_count}`);
  console.log(`  Quiz blocks: ${report.stats.quiz_block_count}`);
  console.log(`  Artifact blocks: ${report.stats.artifact_block_count}`);
  console.log(`  Total words: ${report.stats.total_word_count}`);
  console.log(`  Avg words/block: ${report.stats.avg_words_per_block}`);
  console.log(
    `  Application+ quiz: ${report.stats.application_plus_percent.toFixed(0)}%`,
  );

  if (report.issues.length > 0) {
    console.log(`\nIssues (${report.issues.length}):`);
    for (const issue of report.issues) {
      const prefix = issue.severity === 'error' ? 'ERROR' : 'WARN';
      console.log(`  [${prefix}] ${issue.category}: ${issue.message}`);
    }
  } else {
    console.log('\nNo issues found.');
  }

  if (!report.passed) {
    process.exit(1);
  }
}

function commandTemplate(): void {
  console.log(briefTemplateJson());
}

// ── Main ─────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log('SABIficate AI Content Pipeline');
    console.log('');
    console.log('Usage:');
    console.log('  npx tsx pipeline/cli/index.ts generate <brief.json>');
    console.log('  npx tsx pipeline/cli/index.ts validate <package.json>');
    console.log('  npx tsx pipeline/cli/index.ts template');
    console.log('');
    console.log('Commands:');
    console.log('  generate   Run the full 5-stage pipeline on an SME brief');
    console.log('  validate   Validate an existing lesson package');
    console.log('  template   Print an example SME brief to stdout');
    process.exit(0);
  }

  switch (command) {
    case 'generate': {
      const briefPath = args[1];
      if (!briefPath) {
        console.error('Error: generate requires a path to a brief JSON file');
        console.error('Usage: npx tsx pipeline/cli/index.ts generate <brief.json>');
        process.exit(1);
      }
      await commandGenerate(briefPath);
      break;
    }

    case 'validate': {
      const packagePath = args[1];
      if (!packagePath) {
        console.error('Error: validate requires a path to a lesson package JSON file');
        console.error('Usage: npx tsx pipeline/cli/index.ts validate <package.json>');
        process.exit(1);
      }
      await commandValidate(packagePath);
      break;
    }

    case 'template':
      commandTemplate();
      break;

    default:
      console.error(`Unknown command: ${command}`);
      console.error('Valid commands: generate, validate, template');
      process.exit(1);
  }
}

main().catch((err) => {
  console.error('Pipeline error:', err instanceof Error ? err.message : err);
  process.exit(1);
});
