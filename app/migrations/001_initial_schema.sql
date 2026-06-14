-- SABIficate Database Schema
-- Split architecture: App tables on Hetzner, PII tables flagged for Nigerian host

-- ============================================================
-- PII TABLES (Nigerian host: Layer3Cloud Lagos or MainOne)
-- ============================================================

-- NDPA: PII TABLE - Nigerian host
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    role VARCHAR(20) NOT NULL DEFAULT 'learner' CHECK (role IN ('learner', 'corporate_admin', 'platform_admin')),
    org_id UUID REFERENCES organizations(id),
    department_id UUID REFERENCES departments(id),
    language_preference VARCHAR(5) DEFAULT 'en',
    data_saver_mode VARCHAR(20) DEFAULT 'data_saver' CHECK (data_saver_mode IN ('full', 'data_saver', 'ultra_light')),
    consent_education_only BOOLEAN NOT NULL DEFAULT true,
    consent_anonymized_aggregate BOOLEAN NOT NULL DEFAULT false,
    consent_full_profile BOOLEAN NOT NULL DEFAULT false,
    consent_whatsapp_notifications BOOLEAN NOT NULL DEFAULT false,
    consent_sms_notifications BOOLEAN NOT NULL DEFAULT false,
    consent_updated_at TIMESTAMPTZ,
    email_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- NDPA: PII TABLE - Nigerian host
CREATE TABLE learner_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    lesson_id UUID NOT NULL REFERENCES lessons(id),
    course_id UUID NOT NULL REFERENCES courses(id),
    status VARCHAR(20) NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    progress_percent SMALLINT NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
    time_spent_seconds INTEGER NOT NULL DEFAULT 0,
    difficulty_tier VARCHAR(20) NOT NULL DEFAULT 'beginner',
    last_block_index INTEGER DEFAULT 0,
    completed_at TIMESTAMPTZ,
    client_id VARCHAR(64),
    synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, lesson_id)
);

-- NDPA: PII TABLE - Nigerian host
CREATE TABLE assessment_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    lesson_id UUID NOT NULL REFERENCES lessons(id),
    quiz_block_id VARCHAR(100) NOT NULL,
    selected_option INTEGER NOT NULL,
    is_correct BOOLEAN NOT NULL,
    answered_at TIMESTAMPTZ NOT NULL,
    difficulty_tier VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- NDPA: PII TABLE - Nigerian host
CREATE TABLE consent_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    consent_type VARCHAR(50) NOT NULL,
    granted BOOLEAN NOT NULL,
    version VARCHAR(10) NOT NULL DEFAULT '1.0',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_consent_records_user ON consent_records(user_id);

-- ============================================================
-- APPLICATION TABLES (Hetzner Nuremberg)
-- ============================================================

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    industry VARCHAR(100),
    size_category VARCHAR(50),
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE course_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    sort_order INTEGER DEFAULT 0
);

CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    category_id UUID REFERENCES course_categories(id),
    difficulty_level VARCHAR(20) NOT NULL DEFAULT 'beginner',
    estimated_duration_minutes INTEGER,
    cpd_hours NUMERIC(4,1),
    professional_body VARCHAR(10),
    learning_objectives JSONB DEFAULT '[]',
    prerequisites JSONB DEFAULT '[]',
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    estimated_duration_minutes INTEGER,
    content_beginner JSONB,
    content_intermediate JSONB,
    content_advanced JSONB,
    has_quiz BOOLEAN DEFAULT false,
    has_artifact BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE enrollment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    course_id UUID NOT NULL REFERENCES courses(id),
    org_id UUID REFERENCES organizations(id),
    enrollment_type VARCHAR(20) NOT NULL DEFAULT 'individual' CHECK (enrollment_type IN ('individual', 'corporate', 'invitation')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'suspended', 'expired')),
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    UNIQUE(user_id, course_id)
);

-- Subscription and Payment tables
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('individual', 'corporate')),
    price_ngn INTEGER NOT NULL,
    billing_cycle VARCHAR(20) NOT NULL CHECK (billing_cycle IN ('monthly', 'quarterly', 'annual')),
    features JSONB DEFAULT '[]',
    max_courses INTEGER,
    paystack_plan_code VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    org_id UUID REFERENCES organizations(id),
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'cancelled', 'expired')),
    paystack_subscription_code VARCHAR(100),
    paystack_email_token VARCHAR(100),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    org_id UUID REFERENCES organizations(id),
    amount_ngn INTEGER NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'NGN',
    payment_method VARCHAR(20) CHECK (payment_method IN ('card', 'bank_transfer', 'ussd')),
    gateway VARCHAR(20) NOT NULL DEFAULT 'paystack',
    gateway_reference VARCHAR(255) UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'refunded')),
    metadata_json JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    org_id UUID NOT NULL REFERENCES organizations(id),
    plan_id UUID REFERENCES subscription_plans(id),
    seat_count INTEGER NOT NULL,
    subtotal_ngn INTEGER NOT NULL,
    vat_ngn INTEGER NOT NULL,
    total_ngn INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
    due_date DATE NOT NULL,
    paid_at TIMESTAMPTZ,
    pdf_url TEXT,
    billing_contact_email VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE dunning_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES payment_transactions(id),
    user_id UUID NOT NULL REFERENCES users(id),
    attempt_number SMALLINT NOT NULL,
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('email', 'sms', 'whatsapp')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
    sent_at TIMESTAMPTZ,
    next_attempt_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Credential tables
CREATE TABLE credential_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    co_brand_org_id UUID REFERENCES organizations(id),
    co_brand_logo_url TEXT,
    co_brand_signatory VARCHAR(255),
    badge_image_url TEXT,
    criteria_narrative TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE issued_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES credential_templates(id),
    user_id UUID NOT NULL REFERENCES users(id),
    course_id UUID NOT NULL REFERENCES courses(id),
    certificate_number VARCHAR(50) UNIQUE NOT NULL,
    credential_json JSONB NOT NULL,
    verification_url TEXT NOT NULL,
    qr_code_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
    evidence_urls JSONB DEFAULT '[]',
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ
);

-- Seat allocation tables
CREATE TABLE seat_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    total_seats INTEGER NOT NULL,
    used_seats INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE department_seat_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seat_allocation_id UUID NOT NULL REFERENCES seat_allocations(id),
    department_id UUID NOT NULL REFERENCES departments(id),
    allocated_seats INTEGER NOT NULL,
    used_seats INTEGER NOT NULL DEFAULT 0
);

-- WhatsApp tables
CREATE TABLE whatsapp_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    phone_number VARCHAR(20) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    preferred_time VARCHAR(5) DEFAULT '08:00',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    message_type VARCHAR(20) NOT NULL,
    template_name VARCHAR(100),
    content JSONB,
    wa_message_id VARCHAR(100),
    status VARCHAR(20) DEFAULT 'sent',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE whatsapp_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL,
    language VARCHAR(10) DEFAULT 'en',
    body_template TEXT NOT NULL,
    button_config JSONB,
    meta_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bulk enrollment tables
CREATE TABLE bulk_enrollment_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    admin_user_id UUID NOT NULL REFERENCES users(id),
    file_name VARCHAR(255),
    total_rows INTEGER NOT NULL DEFAULT 0,
    processed INTEGER NOT NULL DEFAULT 0,
    succeeded INTEGER NOT NULL DEFAULT 0,
    failed INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE TABLE bulk_enrollment_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES bulk_enrollment_jobs(id),
    row_number INTEGER NOT NULL,
    email VARCHAR(255),
    error_message TEXT NOT NULL
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_org ON users(org_id);
CREATE INDEX idx_learner_progress_user ON learner_progress(user_id);
CREATE INDEX idx_learner_progress_course ON learner_progress(course_id);
CREATE INDEX idx_assessment_user_lesson ON assessment_attempts(user_id, lesson_id);
CREATE INDEX idx_enrollment_user ON enrollment(user_id);
CREATE INDEX idx_enrollment_course ON enrollment(course_id);
CREATE INDEX idx_enrollment_org ON enrollment(org_id);
CREATE INDEX idx_lessons_module ON lessons(module_id);
CREATE INDEX idx_lessons_course ON lessons(course_id);
CREATE INDEX idx_modules_course ON modules(course_id);
CREATE INDEX idx_payment_user ON payment_transactions(user_id);
CREATE INDEX idx_payment_reference ON payment_transactions(gateway_reference);
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_credentials_user ON issued_credentials(user_id);
CREATE INDEX idx_whatsapp_user ON whatsapp_subscriptions(user_id);
CREATE INDEX idx_dunning_transaction ON dunning_attempts(transaction_id);
