/**
 * Example SME brief template and factory.
 * Run `npx tsx pipeline/cli/index.ts template` to dump this to stdout.
 */
import type { CourseBrief } from '../schemas/briefSchema.ts';

/**
 * Returns a fully-populated example CourseBrief that can be used
 * as a starting template by SMEs filling in their own course details.
 */
export function exampleBrief(): CourseBrief {
  return {
    title: 'Financial Analysis for Nigerian Banking Professionals',
    slug: 'financial-analysis-nigerian-banking',
    description:
      'A comprehensive course covering financial statement analysis, credit risk assessment, and regulatory compliance for professionals in the Nigerian banking sector.',
    category: 'Finance',
    difficulty_level: 'intermediate',
    professional_body: 'CIBN',
    cpd_hours: 12,
    industry_vertical: 'Banking',
    target_career_level: 'Mid-career',
    modules: [
      {
        title: 'Fundamentals of Financial Statement Analysis',
        description:
          'This module covers the core techniques for reading and interpreting financial statements in the Nigerian banking context, including CBN reporting requirements.',
        lessons: [
          {
            title: 'Reading Balance Sheets in Nigerian Banks',
            learning_objective:
              'Learners will be able to identify and interpret key components of a Nigerian bank balance sheet, including CBN-mandated disclosures.',
            key_topics: [
              'Balance sheet structure for Nigerian banks',
              'CBN prudential guidelines on asset classification',
              'Tier 1 and Tier 2 capital requirements',
              'Off-balance sheet items specific to Nigerian banking',
            ],
            estimated_duration_minutes: 25,
            target_bloom_levels: ['understand', 'apply'],
            include_artifact: true,
            scenario_context:
              'A mid-level analyst at a Tier 1 Nigerian bank reviews quarterly financial statements and must flag items that may require CBN regulatory attention.',
          },
          {
            title: 'Income Statement Analysis and Profitability Ratios',
            learning_objective:
              'Learners will calculate and interpret key profitability ratios from Nigerian bank income statements.',
            key_topics: [
              'Net interest margin in the Nigerian context',
              'Non-interest income sources (e-banking, FX)',
              'Cost-to-income ratio benchmarks for Nigerian banks',
              'Impact of monetary policy rate changes on bank profitability',
            ],
            estimated_duration_minutes: 30,
            target_bloom_levels: ['apply', 'analyze'],
            include_artifact: false,
          },
        ],
      },
      {
        title: 'Credit Risk Assessment',
        description:
          'Practical techniques for evaluating credit risk in Nigerian corporate and SME lending, aligned with CIBN competency frameworks.',
        lessons: [
          {
            title: 'Credit Scoring Models for Nigerian SMEs',
            learning_objective:
              'Learners will apply credit scoring methodologies adapted for the Nigerian SME landscape, accounting for limited financial data availability.',
            key_topics: [
              'Challenges of credit scoring in data-sparse environments',
              'Alternative data sources (BVN records, mobile money, trade references)',
              'CBN guidelines on SME lending',
              'Building scorecards for micro-enterprises',
            ],
            estimated_duration_minutes: 35,
            target_bloom_levels: ['apply', 'analyze', 'evaluate'],
            include_artifact: true,
            scenario_context:
              'A credit analyst at a mid-tier Nigerian bank evaluates a loan application from a Lagos-based SME in the textile industry with limited formal financial records.',
          },
        ],
      },
    ],
    additional_context:
      'All content should reference current CBN circulars and CIBN exam syllabi where applicable. Use Naira (NGN) for all monetary examples. Include references to IFRS 9 implementation in Nigeria.',
  };
}

/**
 * Returns the example brief as a formatted JSON string,
 * suitable for writing to a file or printing to stdout.
 */
export function briefTemplateJson(): string {
  return JSON.stringify(exampleBrief(), null, 2);
}
