import { query } from '../server/db/index.js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const courseDataRaw = JSON.parse(readFileSync(resolve(__dirname, 'course-data.json'), 'utf-8'));

interface LessonBlock {
  type: string;
  id: string;
  [key: string]: unknown;
}

interface LessonDef {
  title: string;
  sort_order: number;
  estimated_duration_minutes: number;
  has_quiz: boolean;
}

interface ModuleDef {
  title: string;
  sort_order: number;
  lessons: LessonDef[];
}

interface CourseData {
  slug: string;
  learning_objectives: string[];
  prerequisites: string[];
  modules: ModuleDef[];
  first_lesson_content: { blocks: LessonBlock[] };
}

// Static course metadata (matches static-courses.ts)
const COURSE_META: Record<string, {
  title: string;
  description: string;
  category_slug: string;
  difficulty_level: string;
  estimated_duration_minutes: number;
  cpd_hours: number | null;
  professional_body: string | null;
  thumbnail_url: string | null;
}> = {
  'aml-kyc-compliance': {
    title: 'AML/KYC Compliance for Nigerian Financial Institutions',
    description: 'Comprehensive anti-money laundering and know-your-customer training aligned with the ML(P&P) Act 2022, CBN AML/CFT Regulations, and NFIU reporting requirements.',
    category_slug: 'banking-finance', difficulty_level: 'working',
    estimated_duration_minutes: 240, cpd_hours: 4, professional_body: 'CIBN',
    thumbnail_url: 'https://plus.unsplash.com/premium_photo-1707155465527-c5a2935b21cc?w=800&h=500&fit=crop',
  },
  'ndpa-compliance': {
    title: 'Nigeria Data Protection Act (NDPA) 2023 Compliance',
    description: 'Master the Nigeria Data Protection Act 2023 and NDPC regulations. Covers lawful basis for processing, data subject rights, breach notification, and DPIA requirements.',
    category_slug: 'governance-compliance', difficulty_level: 'working',
    estimated_duration_minutes: 180, cpd_hours: 3, professional_body: null,
    thumbnail_url: 'https://images.unsplash.com/photo-1528901166007-3784c7dd3653?w=800&h=500&fit=crop',
  },
  'first-time-manager': {
    title: 'First-Time Manager Acceleration Program',
    description: 'Transition from individual contributor to effective people leader. Covers delegation, feedback, performance conversations, and team dynamics in Nigerian workplaces.',
    category_slug: 'leadership-management', difficulty_level: 'foundational',
    estimated_duration_minutes: 300, cpd_hours: 5, professional_body: null,
    thumbnail_url: 'https://images.unsplash.com/photo-1614023342667-6f060e9d1e04?w=800&h=500&fit=crop',
  },
  'intro-professional-development': {
    title: 'Introduction to Professional Development (Free Preview)',
    description: 'Explore how SABIficate works with this free introductory course. Learn the microlearning methodology and see the card-swipe lesson experience firsthand.',
    category_slug: 'professional-development', difficulty_level: 'foundational',
    estimated_duration_minutes: 40, cpd_hours: null, professional_body: null,
    thumbnail_url: 'https://images.unsplash.com/photo-1573496528298-f0e9d3c7ce55?w=800&h=500&fit=crop',
  },
  'corporate-governance': {
    title: 'Corporate Governance for Nigerian Financial Services',
    description: 'Master SEC, CBN, and NAICOM corporate governance codes. Covers board composition, risk oversight, audit committees, and compliance frameworks for Nigerian financial institutions.',
    category_slug: 'banking-finance', difficulty_level: 'applied',
    estimated_duration_minutes: 200, cpd_hours: 4, professional_body: 'CIBN',
    thumbnail_url: 'https://plus.unsplash.com/premium_photo-1707155465540-f9e8208d83db?w=800&h=500&fit=crop',
  },
  'cybersecurity-awareness': {
    title: 'Cybersecurity Awareness for Financial Institutions',
    description: 'Essential cybersecurity training aligned with CBN Risk-Based Cybersecurity Framework. Covers phishing, social engineering, data protection, and incident response.',
    category_slug: 'banking-finance', difficulty_level: 'working',
    estimated_duration_minutes: 200, cpd_hours: 3, professional_body: null,
    thumbnail_url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&h=500&fit=crop',
  },
  'change-management': {
    title: 'Change Management for Institutional Transformation',
    description: 'Lead organizational change effectively using proven frameworks adapted for Nigerian institutions. Covers stakeholder management, resistance navigation, and culture transformation.',
    category_slug: 'leadership-management', difficulty_level: 'working',
    estimated_duration_minutes: 360, cpd_hours: 6, professional_body: null,
    thumbnail_url: 'https://images.unsplash.com/photo-1549086802-bb458f399f05?w=800&h=500&fit=crop',
  },
  'consumer-protection': {
    title: 'Consumer Protection for Financial Services Staff',
    description: 'Understand CBN Consumer Protection Framework and your obligations. Covers complaint handling, transparent pricing, responsible lending, and regulatory enforcement.',
    category_slug: 'banking-finance', difficulty_level: 'working',
    estimated_duration_minutes: 160, cpd_hours: 3, professional_body: null,
    thumbnail_url: 'https://images.unsplash.com/photo-1573496528641-1ea45c3ba70e?w=800&h=500&fit=crop',
  },
  'professional-ethics': {
    title: 'Professional Ethics & Workplace Conduct',
    description: 'Navigate ethical challenges in Nigerian professional settings. Covers conflict of interest, whistleblowing, anti-corruption, and professional body codes of conduct.',
    category_slug: 'governance-compliance', difficulty_level: 'working',
    estimated_duration_minutes: 160, cpd_hours: 3, professional_body: null,
    thumbnail_url: 'https://images.unsplash.com/photo-1657449036184-4fb912035102?w=800&h=500&fit=crop',
  },
  'labour-law-essentials': {
    title: 'Nigerian Labour Law Essentials for HR Practitioners',
    description: 'Comprehensive guide to Nigerian labour legislation including the Labour Act, Employee Compensation Act, Pension Reform Act, and NIC rules.',
    category_slug: 'human-resources', difficulty_level: 'working',
    estimated_duration_minutes: 200, cpd_hours: 4, professional_body: 'CIPM',
    thumbnail_url: 'https://images.unsplash.com/photo-1680309915319-d46a0e40a153?w=800&h=500&fit=crop',
  },
  'business-presentations': {
    title: 'Better Business Presentations & Executive Communication',
    description: 'Master the art of business presentations and executive communication. From boardroom presentations to client pitches, learn frameworks that work in Nigerian business culture.',
    category_slug: 'professional-development', difficulty_level: 'foundational',
    estimated_duration_minutes: 240, cpd_hours: 4, professional_body: null,
    thumbnail_url: 'https://images.unsplash.com/photo-1604783125462-37d81c7385e6?w=800&h=500&fit=crop',
  },
  'succession-planning': {
    title: 'Succession Planning & Leadership Pipeline Development',
    description: 'Build sustainable leadership pipelines for Nigerian organizations. Covers talent identification, development planning, knowledge transfer, and transition management.',
    category_slug: 'leadership-management', difficulty_level: 'applied',
    estimated_duration_minutes: 280, cpd_hours: 5, professional_body: null,
    thumbnail_url: 'https://plus.unsplash.com/premium_photo-1707155466084-690e1646e40d?w=800&h=500&fit=crop',
  },
  'cipm-certification-prep': {
    title: 'CIPM HR Professional Certification Prep & CPD',
    description: 'Prepare for CIPM certification exams and meet continuing professional development requirements. Covers all CIPM competency domains with Nigerian HR case studies.',
    category_slug: 'human-resources', difficulty_level: 'working',
    estimated_duration_minutes: 300, cpd_hours: 6, professional_body: 'CIPM',
    thumbnail_url: 'https://plus.unsplash.com/premium_photo-1663040111191-c585a609fd9c?w=800&h=500&fit=crop',
  },
  'pencom-compliance': {
    title: 'PenCom Compliance for Pension Staff',
    description: 'Navigate PenCom regulatory requirements for pension fund administrators. Covers the Pension Reform Act 2014, investment guidelines, and compliance reporting.',
    category_slug: 'insurance-pensions', difficulty_level: 'working',
    estimated_duration_minutes: 200, cpd_hours: 4, professional_body: 'PenCom',
    thumbnail_url: 'https://images.unsplash.com/photo-1669710208503-d88214727bac?w=800&h=500&fit=crop',
  },
  'itf-workforce-development': {
    title: 'ITF-Qualifying Workforce Development Training',
    description: 'Maximize your ITF training levy reimbursement with qualifying courses. Covers workforce planning, skills gap analysis, and training program design.',
    category_slug: 'human-resources', difficulty_level: 'working',
    estimated_duration_minutes: 320, cpd_hours: 5, professional_body: 'ITF',
    thumbnail_url: 'https://images.unsplash.com/photo-1758876202610-bae5608f5051?w=800&h=500&fit=crop',
  },
  'performance-management': {
    title: 'Performance Management Frameworks',
    description: 'Design and implement effective performance management systems for Nigerian organizations. Covers OKRs, balanced scorecards, 360-degree feedback, and performance improvement plans.',
    category_slug: 'human-resources', difficulty_level: 'working',
    estimated_duration_minutes: 200, cpd_hours: 4, professional_body: null,
    thumbnail_url: 'https://images.unsplash.com/photo-1739300293504-234817eead52?w=800&h=500&fit=crop',
  },
  'naicom-compliance': {
    title: 'Insurance Industry Compliance & NAICOM Standards',
    description: 'Master NAICOM regulatory requirements and the new NIIRA 2025 framework. Covers licensing, capital requirements, market conduct, and claims handling compliance.',
    category_slug: 'insurance-pensions', difficulty_level: 'working',
    estimated_duration_minutes: 240, cpd_hours: 4, professional_body: 'NAICOM',
    thumbnail_url: 'https://images.unsplash.com/photo-1758519291531-e96279895745?w=800&h=500&fit=crop',
  },
  'cibn-cpd': {
    title: 'CIBN Mandatory CPD for Bankers',
    description: 'Meet your CIBN continuing professional development requirements. Covers banking ethics, digital banking, risk management, and financial inclusion topics.',
    category_slug: 'banking-finance', difficulty_level: 'working',
    estimated_duration_minutes: 200, cpd_hours: 4, professional_body: 'CIBN',
    thumbnail_url: 'https://images.unsplash.com/photo-1758876202167-f81c995c3fdc?w=800&h=500&fit=crop',
  },
  'ican-mcpe': {
    title: 'ICAN Mandatory Continuing Professional Education (MCPE)',
    description: 'Fulfill your ICAN MCPE credit requirements. Covers IFRS updates, tax law changes, audit standards, and professional ethics for chartered accountants.',
    category_slug: 'banking-finance', difficulty_level: 'working',
    estimated_duration_minutes: 200, cpd_hours: 4, professional_body: 'ICAN',
    thumbnail_url: 'https://images.unsplash.com/photo-1573166953836-06864dc70a21?w=800&h=500&fit=crop',
  },
  'nba-cpd': {
    title: 'NBA Mandatory CPD for Lawyers',
    description: 'Complete your NBA MCPD requirements. Covers legal ethics, ADR, digital law, business law updates, and professional practice management.',
    category_slug: 'governance-compliance', difficulty_level: 'working',
    estimated_duration_minutes: 200, cpd_hours: 4, professional_body: 'NBA',
    thumbnail_url: 'https://images.unsplash.com/photo-1573878414075-be35f08479e5?w=800&h=500&fit=crop',
  },
  'ai-data-analytics': {
    title: 'AI & Data Analytics for Business Professionals',
    description: 'Understand AI and data analytics applications in Nigerian business. Covers prompt engineering, data-driven decision making, and responsible AI use aligned with NDPC guidelines.',
    category_slug: 'digital-skills', difficulty_level: 'working',
    estimated_duration_minutes: 240, cpd_hours: 4, professional_body: null,
    thumbnail_url: 'https://plus.unsplash.com/premium_photo-1683140655656-20448abc55da?w=800&h=500&fit=crop',
  },
  'credit-risk-management': {
    title: 'Credit Risk Management for Banking Professionals',
    description: 'Master credit risk assessment and management aligned with CBN prudential guidelines. Covers credit analysis, portfolio management, NPL resolution, and IFRS 9 implications.',
    category_slug: 'banking-finance', difficulty_level: 'working',
    estimated_duration_minutes: 200, cpd_hours: 4, professional_body: 'CIBN',
    thumbnail_url: 'https://plus.unsplash.com/premium_photo-1661584115667-dabb4bfc3c98?w=800&h=500&fit=crop',
  },
  'hse-compliance': {
    title: 'HSE Compliance for Oil & Gas and Industrial Operations',
    description: 'Essential health, safety, and environment compliance training for Nigerian oil & gas and industrial operations. Covers DPR/NUPRC regulations, OSHA standards, and permit-to-work systems.',
    category_slug: 'health-safety', difficulty_level: 'working',
    estimated_duration_minutes: 280, cpd_hours: 5, professional_body: null,
    thumbnail_url: 'https://images.unsplash.com/photo-1668609268461-4f6a15269ff1?w=800&h=500&fit=crop',
  },
  'civil-service-hr-transformation': {
    title: 'Civil Service to Performance Culture: HR Transformation',
    description: 'Transform traditional civil service HR practices into modern performance-driven systems. Covers IPPIS, TSA compliance, performance contracts, and public service reform.',
    category_slug: 'human-resources', difficulty_level: 'applied',
    estimated_duration_minutes: 240, cpd_hours: 4, professional_body: null,
    thumbnail_url: 'https://images.unsplash.com/photo-1758611972971-1c8b9c6d7822?w=800&h=500&fit=crop',
  },
  'aml-dnfbps': {
    title: 'AML/CFT Compliance for DNFBPs',
    description: 'Anti-money laundering compliance specifically for Designated Non-Financial Businesses and Professions. Covers SCUML registration, STR filing, and sector-specific risk assessment.',
    category_slug: 'governance-compliance', difficulty_level: 'working',
    estimated_duration_minutes: 200, cpd_hours: 4, professional_body: null,
    thumbnail_url: 'https://images.unsplash.com/photo-1669034750695-dfe5cad91d6d?w=800&h=500&fit=crop',
  },
  'post-merger-integration': {
    title: 'Post-Merger Talent Integration for Nigerian Banks',
    description: 'Navigate the people side of bank mergers and acquisitions. Covers talent assessment, culture integration, redundancy management, and regulatory requirements.',
    category_slug: 'banking-finance', difficulty_level: 'applied',
    estimated_duration_minutes: 240, cpd_hours: 4, professional_body: null,
    thumbnail_url: 'https://plus.unsplash.com/premium_photo-1707155465551-0d2b570926d6?w=800&h=500&fit=crop',
  },
  'efiko-builders': {
    title: 'Efiko Builders: Entrepreneurship Acceleration Program',
    description: 'Launch and grow your business in Nigeria. Covers business model validation, CAC registration, funding strategies, digital marketing, and scaling for Nigerian entrepreneurs.',
    category_slug: 'entrepreneurship', difficulty_level: 'foundational',
    estimated_duration_minutes: 300, cpd_hours: null, professional_body: null,
    thumbnail_url: 'https://images.unsplash.com/photo-1604933762021-54a5858c9832?w=800&h=500&fit=crop',
  },
  'financial-literacy': {
    title: 'Financial Literacy for Nigerian Professionals',
    description: 'Take control of your personal finances. Covers budgeting, saving, investing in Nigerian markets, pension optimization, insurance, and tax planning.',
    category_slug: 'banking-finance', difficulty_level: 'foundational',
    estimated_duration_minutes: 200, cpd_hours: null, professional_body: null,
    thumbnail_url: 'https://images.unsplash.com/photo-1573496800440-5c9c48a8d0f0?w=800&h=500&fit=crop',
  },
  'emotional-intelligence': {
    title: 'Emotional Intelligence for Nigerian Business Leaders',
    description: 'Develop emotional intelligence for high-performance leadership in Nigerian organizations. Covers self-awareness, empathy, conflict resolution, and culturally-adapted EI frameworks.',
    category_slug: 'leadership-management', difficulty_level: 'working',
    estimated_duration_minutes: 200, cpd_hours: 3, professional_body: null,
    thumbnail_url: 'https://images.unsplash.com/photo-1765648684613-b77086065bc1?w=800&h=500&fit=crop',
  },
  'employee-retention': {
    title: 'Employee Retention & Engagement Strategies',
    description: 'Combat Nigeria\'s 71% first-year turnover rate with proven retention strategies. Covers total rewards design, EVP development, engagement surveys, and exit analysis.',
    category_slug: 'human-resources', difficulty_level: 'working',
    estimated_duration_minutes: 240, cpd_hours: 4, professional_body: null,
    thumbnail_url: 'https://images.unsplash.com/photo-1484557052118-f32bd25b45b5?w=800&h=500&fit=crop',
  },
  'data-analytics-foundations': {
    title: 'Data Analytics Foundations: Excel, SQL & Power BI',
    description: 'Build practical data analytics skills from scratch. Covers advanced Excel, SQL for business data, Power BI dashboards, and data storytelling for Nigerian business contexts.',
    category_slug: 'digital-skills', difficulty_level: 'foundational',
    estimated_duration_minutes: 240, cpd_hours: 4, professional_body: null,
    thumbnail_url: 'https://plus.unsplash.com/premium_photo-1664301887532-328f07bb2c24?w=800&h=500&fit=crop',
  },
  'pension-administration': {
    title: 'Pension Administration Compliance for PFA Staff',
    description: 'Navigate PFA compliance requirements under the Pension Reform Act 2014. Covers RSA management, fund administration, contributor services, and PenCom audit preparation.',
    category_slug: 'insurance-pensions', difficulty_level: 'working',
    estimated_duration_minutes: 200, cpd_hours: 4, professional_body: 'PenCom',
    thumbnail_url: 'https://images.unsplash.com/photo-1573164574001-518958d9baa2?w=800&h=500&fit=crop',
  },
  'customer-service-excellence': {
    title: 'Customer Service Excellence for Financial Services',
    description: 'Deliver exceptional customer service aligned with CBN Consumer Protection Framework. Covers complaint resolution, digital channel service, and service recovery in Nigerian financial institutions.',
    category_slug: 'banking-finance', difficulty_level: 'foundational',
    estimated_duration_minutes: 200, cpd_hours: 3, professional_body: null,
    thumbnail_url: 'https://images.unsplash.com/photo-1612832164313-ac0d7e07b5ce?w=800&h=500&fit=crop',
  },
};

const ALL_CATEGORIES = [
  { name: 'Banking & Finance', slug: 'banking-finance', sort_order: 1 },
  { name: 'Governance & Compliance', slug: 'governance-compliance', sort_order: 2 },
  { name: 'Leadership & Management', slug: 'leadership-management', sort_order: 3 },
  { name: 'Human Resources', slug: 'human-resources', sort_order: 4 },
  { name: 'Professional Development', slug: 'professional-development', sort_order: 5 },
  { name: 'Digital Skills & Technology', slug: 'digital-skills', sort_order: 6 },
  { name: 'Insurance & Pensions', slug: 'insurance-pensions', sort_order: 7 },
  { name: 'Health, Safety & Environment', slug: 'health-safety', sort_order: 8 },
  { name: 'Entrepreneurship', slug: 'entrepreneurship', sort_order: 9 },
];

export async function seedCourses(): Promise<void> {
  const courseData = courseDataRaw as CourseData[];
  console.log(`\nSeeding ${courseData.length} courses...\n`);

  // Ensure all categories exist
  const categoryIds: Record<string, string> = {};
  for (const cat of ALL_CATEGORIES) {
    const result = await query(
      `INSERT INTO course_categories (name, slug, sort_order)
       VALUES ($1, $2, $3)
       ON CONFLICT (slug) DO NOTHING
       RETURNING id`,
      [cat.name, cat.slug, cat.sort_order],
    );
    if (result.rows.length > 0) {
      categoryIds[cat.slug] = result.rows[0].id;
    } else {
      const existing = await query(
        `SELECT id FROM course_categories WHERE slug = $1`,
        [cat.slug],
      );
      categoryIds[cat.slug] = existing.rows[0].id;
    }
  }
  console.log(`  Categories: ${Object.keys(categoryIds).length}`);

  let coursesInserted = 0;
  let modulesInserted = 0;
  let lessonsInserted = 0;

  for (const course of courseData) {
    const meta = COURSE_META[course.slug];
    if (!meta) {
      console.log(`  SKIP: no metadata for ${course.slug}`);
      continue;
    }

    const catId = categoryIds[meta.category_slug];
    if (!catId) {
      console.log(`  SKIP: no category ${meta.category_slug} for ${course.slug}`);
      continue;
    }

    let courseId: string;
    try {
      const courseResult = await query(
        `INSERT INTO courses (title, slug, description, category_id, difficulty_level,
          estimated_duration_minutes, cpd_hours, professional_body,
          thumbnail_url, learning_objectives, prerequisites, is_published, published_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11::jsonb, true, NOW())
         ON CONFLICT (slug) DO UPDATE SET
           learning_objectives = EXCLUDED.learning_objectives,
           prerequisites = EXCLUDED.prerequisites,
           thumbnail_url = EXCLUDED.thumbnail_url
         RETURNING id`,
        [
          meta.title,
          course.slug,
          meta.description,
          catId,
          meta.difficulty_level,
          meta.estimated_duration_minutes,
          meta.cpd_hours,
          meta.professional_body,
          meta.thumbnail_url,
          JSON.stringify(course.learning_objectives),
          JSON.stringify(course.prerequisites),
        ],
      );
      courseId = courseResult.rows[0].id;
      coursesInserted++;
    } catch (err) {
      console.error(`  ERROR inserting course ${course.slug}:`, (err as Error).message);
      continue;
    }

    // Insert modules and lessons
    for (const mod of course.modules) {
      const modResult = await query(
        `INSERT INTO modules (course_id, title, sort_order)
         SELECT $1::uuid, $2::varchar, $3::integer
         WHERE NOT EXISTS (
           SELECT 1 FROM modules WHERE course_id = $1::uuid AND title = $2::varchar
         )
         RETURNING id`,
        [courseId, mod.title, mod.sort_order],
      );

      let moduleId: string;
      if (modResult.rows.length > 0) {
        moduleId = modResult.rows[0].id;
        modulesInserted++;
      } else {
        const existing = await query(
          `SELECT id FROM modules WHERE course_id = $1 AND title = $2`,
          [courseId, mod.title],
        );
        moduleId = existing.rows[0].id;
      }

      for (const lesson of mod.lessons) {
        // First lesson of first module gets free content
        const isFirstLesson = mod.sort_order === 1 && lesson.sort_order === 1;
        const content = isFirstLesson ? course.first_lesson_content : { blocks: [] };

        const lessonResult = await query(
          `INSERT INTO lessons (module_id, course_id, title, sort_order,
            estimated_duration_minutes, content_foundational, content_working,
            content_applied, has_quiz, is_free, is_published)
           SELECT $1::uuid, $2::uuid, $3::varchar, $4::integer, $5::integer,
             $6::jsonb, $6::jsonb, $6::jsonb,
             $7::boolean, $8::boolean, true
           WHERE NOT EXISTS (
             SELECT 1 FROM lessons WHERE course_id = $2::uuid AND module_id = $1::uuid AND title = $3::varchar
           )`,
          [
            moduleId,
            courseId,
            lesson.title,
            lesson.sort_order,
            lesson.estimated_duration_minutes,
            JSON.stringify(content),
            lesson.has_quiz,
            isFirstLesson,
          ],
        );
        if (lessonResult.rowCount && lessonResult.rowCount > 0) {
          lessonsInserted++;
        }
      }
    }

    console.log(`  ${course.slug}: ${course.modules.length} modules, ${course.modules.reduce((a, m) => a + m.lessons.length, 0)} lessons`);
  }

  console.log(`\n── Course Seed Summary ────────────────────────────────`);
  console.log(`  Courses:  ${coursesInserted}`);
  console.log(`  Modules:  ${modulesInserted}`);
  console.log(`  Lessons:  ${lessonsInserted}`);
  console.log(`───────────────────────────────────────────────────────\n`);
}
