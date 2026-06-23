-- ============================================================
-- SABIficate Curriculum Studio — Migration 002
-- New tables for the 7-stage authoring pipeline
-- References existing: authoring_tracks, concept_catalog,
--   review_actions, prompt_templates, users, courses, modules, lessons
-- ============================================================

-- 1. Add 'curriculum_author' and 'sme_reviewer' to the user role enum.
--    The existing CHECK constraint must be replaced.
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('learner', 'department_admin', 'corporate_admin', 'platform_admin', 'curriculum_author', 'sme_reviewer'));

-- 2. Add columns to authoring_tracks for stages 2-4 data that lives
--    naturally on the track record itself (JSONB keeps it lean).
ALTER TABLE authoring_tracks
  ADD COLUMN IF NOT EXISTS target_learner_role VARCHAR(255),
  ADD COLUMN IF NOT EXISTS context_mode VARCHAR(20) DEFAULT 'nigerian'
    CHECK (context_mode IN ('nigerian', 'generic')),
  ADD COLUMN IF NOT EXISTS things_to_avoid TEXT,
  ADD COLUMN IF NOT EXISTS paywall_lesson_index INTEGER DEFAULT 2,
  ADD COLUMN IF NOT EXISTS decomposition_meta JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS brief_meta JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS generation_meta JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS published_course_id UUID,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- 3. Trust claims — flagged numeric/factual claims needing source verification.
--    Separate table because reviewers query/filter these independently.
CREATE TABLE IF NOT EXISTS trust_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id UUID NOT NULL,
    spine_node_index INTEGER NOT NULL,
    depth_tier VARCHAR(20) NOT NULL CHECK (depth_tier IN ('foundational', 'working', 'applied')),
    claim_text TEXT NOT NULL,
    claim_type VARCHAR(30) NOT NULL DEFAULT 'numeric' CHECK (claim_type IN ('numeric', 'regulatory', 'statistical', 'citation')),
    source_url TEXT,
    source_label VARCHAR(255),
    verified BOOLEAN NOT NULL DEFAULT false,
    verified_by UUID,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trust_claims_track ON trust_claims(track_id);

-- 4. Assembly reviews — one record per full review pass by an SME.
--    Links to review_actions for per-lesson decisions.
CREATE TABLE IF NOT EXISTS assembly_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id UUID NOT NULL,
    reviewer_id UUID NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'approved', 'changes_requested')),
    terminology_drift_ok BOOLEAN,
    difficulty_inversion_ok BOOLEAN,
    artifact_redundancy_ok BOOLEAN,
    coverage_gap_ok BOOLEAN,
    reviewer_notes TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_assembly_reviews_track ON assembly_reviews(track_id);

-- 5. Language readiness — per-language generation/review status for a track.
CREATE TABLE IF NOT EXISTS language_readiness (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id UUID NOT NULL,
    language_code VARCHAR(10) NOT NULL,
    generation_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (generation_status IN ('pending', 'generating', 'generated', 'failed')),
    review_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'in_review', 'approved', 'rejected')),
    reviewer_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(track_id, language_code)
);

CREATE INDEX IF NOT EXISTS idx_language_readiness_track ON language_readiness(track_id);

-- 6. Extend review_actions to also reference authoring_tracks
ALTER TABLE review_actions
  ADD COLUMN IF NOT EXISTS track_id UUID,
  ADD COLUMN IF NOT EXISTS review_id UUID,
  ADD COLUMN IF NOT EXISTS spine_node_index INTEGER,
  ADD COLUMN IF NOT EXISTS depth_tier VARCHAR(20),
  ADD COLUMN IF NOT EXISTS category VARCHAR(30)
    CHECK (category IN ('terminology_drift', 'difficulty_inversion', 'artifact_redundancy', 'coverage_gap', 'general'));

-- 7. Generation jobs — track async AI generation attempts per track.
CREATE TABLE IF NOT EXISTS generation_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id UUID NOT NULL,
    job_type VARCHAR(30) NOT NULL CHECK (job_type IN ('decomposition', 'course_generation', 'localization')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    input_params JSONB NOT NULL DEFAULT '{}',
    output_data JSONB,
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_generation_jobs_track ON generation_jobs(track_id);
