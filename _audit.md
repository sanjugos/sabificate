# SABIficate Platform — Comprehensive QA Audit & Manual Testing Guide

**Version:** 3.0 — Post-Programmatic Test Suite  
**Date:** 2026-06-23  
**Live URL:** https://sabificate.forwardai.dev  
**API Base:** https://sabificate.forwardai.dev/api/v1  
**Automated Test Suite:** 84/84 PASS (100%)  
**Prepared for:** Clark / Quaco (manual walkthrough & screenshot capture)

---

## Test Accounts

| Role | Email | Password | Notes |
|------|-------|----------|-------|
| Learner (demo) | demo@sabificate.com | demo1234 | Pre-enrolled in AML course, has progress |
| Corporate Admin | admin@firstbank-training.ng | admin1234 | First Bank org, compliance dashboard |
| Founder | sanju@forwardai.dev | Shajan2026! | Full access |

---

## How to Use This Document

1. Go section by section — each maps to a page/feature on the platform
2. For each test case: reproduce the scenario, compare actual vs expected, take a screenshot
3. Mark each row: PASS / FAIL / NOTE
4. Add screenshots to a shared folder (name format: `{TEST-ID}_{short-desc}.png`)
5. Log bugs and improvements at the bottom of each section
6. The "API Result" column shows what the automated test confirmed — your job is to verify the **UI renders it correctly**

---

## Section 1: Health & Infrastructure (2/2 PASS)

| ID | Scenario | Steps | Expected Result | API Result | Manual Status |
|----|----------|-------|-----------------|------------|---------------|
| H-01 | Health endpoint | Visit `/api/v1/health` in browser | JSON with `status: "ok"` and timestamp | PASS (49ms) | [ ] |
| H-02 | 404 for unknown routes | Visit `/api/v1/nonexistent` | 404 response | PASS (4ms) | [ ] |

---

## Section 2: Registration Page (7/7 PASS)

**Page:** `/register`

### Visual Checklist
- [ ] Page loads with registration form
- [ ] Logo and branding visible
- [ ] Form fields: First Name, Last Name, Email, Password
- [ ] Consent checkboxes visible: "Education only", "Anonymized aggregate", "Full profile"
- [ ] "Already have an account? Login" link present
- [ ] Mobile responsive — test at 375px width
- [ ] Screenshot: `REG_page-load.png`

### Test Cases

| ID | Scenario | Steps | Expected Result | API Result | Manual Status |
|----|----------|-------|-----------------|------------|---------------|
| REG-01 | Empty form submit | Click Register with all fields empty | Validation errors appear on required fields | PASS — server returns 400 | [ ] |
| REG-02 | Missing consent | Fill name/email/password, leave all consent unchecked, submit | Error about consent being required | PASS — 400 | [ ] |
| REG-03 | Invalid email | Enter "not-an-email" as email, fill other fields, submit | "Invalid email" error | PASS — 400 | [ ] |
| REG-04 | Short password | Enter "123" as password, fill other fields, submit | "Password too short" error | PASS — 400 | [ ] |
| REG-05 | Successful registration | Enter valid new email (e.g. `clark.test1@example.com`), password `TestPass123!`, fill name, check consent → submit | Redirected to onboarding or dashboard. JWT stored in localStorage/cookie | PASS — 201 with token | [ ] |
| REG-06 | User profile correct | After successful registration, check stored user object | Has `id`, `email`, `first_name`, `last_name`, `role: "learner"` | PASS | [ ] |
| REG-07 | Duplicate email | Try registering with `demo@sabificate.com` again | "Email already exists" error | PASS — 409 | [ ] |

### Screenshots Needed
- `REG-01_empty-form-errors.png`
- `REG-03_invalid-email.png`
- `REG-05_successful-registration.png`
- `REG-07_duplicate-error.png`

---

## Section 3: Login Page (6/6 PASS)

**Page:** `/login`

### Visual Checklist
- [ ] Form fields: Email, Password
- [ ] "Forgot password?" link (if present)
- [ ] "Create account" / "Register" link
- [ ] Mobile responsive
- [ ] Screenshot: `LOGIN_page-load.png`

### Test Cases

| ID | Scenario | Steps | Expected Result | API Result | Manual Status |
|----|----------|-------|-----------------|------------|---------------|
| LOGIN-01 | Wrong password | Enter `demo@sabificate.com` / `wrongpassword` | Error: "Invalid credentials" | PASS — 401 | [ ] |
| LOGIN-02 | Non-existent email | Enter `nobody@nowhere.com` / `abc123` | Error: "Invalid credentials" (don't reveal if email exists) | PASS — 401 | [ ] |
| LOGIN-03 | Empty form | Click Login with no input | Validation error | PASS — 400 | [ ] |
| LOGIN-04 | Learner login | Enter `demo@sabificate.com` / `demo1234` | Logged in, redirected to dashboard. Token expires in 900s (15min) | PASS — 200, expires_in=900 | [ ] |
| LOGIN-05 | Learner profile | After learner login, verify user name | Shows "Adaeze" as first name, role: learner | PASS | [ ] |
| LOGIN-06 | Admin login | Enter `admin@firstbank-training.ng` / `admin1234` | Logged in with role `corporate_admin`, org_id present | PASS — 200 | [ ] |

### Screenshots Needed
- `LOGIN-01_wrong-password.png`
- `LOGIN-04_successful-login.png`
- `LOGIN-06_admin-login-redirect.png`

---

## Section 4: Auth & Access Control (9/9 PASS)

### Test Cases

| ID | Scenario | Steps | Expected Result | API Result | Manual Status |
|----|----------|-------|-----------------|------------|---------------|
| AUTH-01 | Persona page without login | Clear cookies, visit `/onboarding` | Redirected to login | PASS — 401 | [ ] |
| AUTH-02 | Credentials page without login | Clear cookies, visit `/credentials` | Redirected to login | PASS — 401 | [ ] |
| AUTH-03 | CPD page without login | Clear cookies, visit CPD summary endpoint | Redirected to login | PASS — 401 | [ ] |
| AUTH-04 | Set persona without login | Try to POST persona selection without auth | Rejected | PASS — 401 | [ ] |
| RBAC-01 | Learner visits admin compliance | Login as demo learner → try visiting `/admin` compliance section | 403 or redirected — no access to admin features | PASS — 403 | [ ] |
| RBAC-02 | Learner visits top performers | Same — top performers endpoint blocked | 403 | PASS — 403 | [ ] |
| RBAC-03 | Learner creates compliance req | Same — cannot create compliance requirement | 403 | PASS — 403 | [ ] |
| AUTH-05 | Invalid JWT | Manually edit JWT in localStorage to garbage, refresh | Forced to re-login | PASS — 401 | [ ] |
| AUTH-06 | Tampered JWT | Edit JWT signature portion, refresh | Forced to re-login | PASS — 401 | [ ] |

### Screenshots Needed
- `AUTH-01_unauthenticated-redirect.png`
- `RBAC-01_learner-admin-blocked.png`

---

## Section 5: Persona Gateway / Onboarding (8/8 PASS)

**Page:** `/onboarding` (3-screen flow after registration)

### Visual Checklist
- [ ] Screen 1: Select your persona (4 cards)
- [ ] Screen 2: Calibration questions
- [ ] Screen 3: Confirmation / redirect to dashboard
- [ ] Each persona card shows: name, description, icon
- [ ] Mobile responsive — cards stack vertically
- [ ] Screenshot: `PERS_onboarding-screen1.png`

### Personas Available

| Slug | Display Name | Expected |
|------|-------------|----------|
| new-graduate | New Graduate | Foundational-leaning |
| mid-career-professional | Mid-Career Professional | Working-leaning |
| team-lead-manager | Team Lead / Manager | Working-to-applied |
| senior-specialist | Senior Specialist | Applied-leaning |

### Test Cases

| ID | Scenario | Steps | Expected Result | API Result | Manual Status |
|----|----------|-------|-----------------|------------|---------------|
| PERS-01 | List personas | View onboarding screen 1 | 4 persona cards displayed | PASS — 4 personas | [ ] |
| PERS-02 | Correct slugs | Inspect persona options | All 4 slugs match table above | PASS | [ ] |
| PERS-03 | Calibration questions | Select a persona → see calibration questions | Each persona has calibration questions with answer options | PASS | [ ] |
| PERS-04 | Proficiency map values | Answer calibration questions → check resolved tier | Uses foundational/working/applied (NOT beginner/intermediate/advanced) | PASS | [ ] |
| PERS-05 | Set persona | Complete onboarding flow as mid-career-professional | Persona saved, resolved_tier=working | PASS — 201 | [ ] |
| PERS-06 | Persona persists | Refresh after setting persona, check profile | Shows mid-career-professional, proficiency=working | PASS | [ ] |
| PERS-07 | Existing learner persona | Login as demo learner, check persona status | Returns their persona (or null if never set) | PASS — 200 | [ ] |
| PERS-08 | Invalid persona slug | (API only) Try setting slug "nonexistent-persona" | Rejected with 404 | PASS — 404 | [ ] |

### Screenshots Needed
- `PERS_onboarding-screen1.png` (persona selection)
- `PERS_onboarding-screen2.png` (calibration questions)
- `PERS_onboarding-complete.png` (after completion)

---

## Section 6: Course Catalog (8/8 PASS)

**Page:** `/courses`

### Visual Checklist
- [ ] Grid/list of course cards
- [ ] Each card shows: title, category, difficulty badge, lesson count
- [ ] Search bar works (type and results filter)
- [ ] Category filter dropdown/tabs
- [ ] Difficulty filter (foundational/working/applied)
- [ ] Pagination controls visible when >20 courses
- [ ] Mobile responsive — single column on mobile
- [ ] Screenshot: `CRS_catalog-full.png`

### Test Cases

| ID | Scenario | Steps | Expected Result | API Result | Manual Status |
|----|----------|-------|-----------------|------------|---------------|
| CRS-01 | Page loads with courses | Visit `/courses` | Course grid loads with cards and pagination | PASS — 34 courses, pagination present | [ ] |
| CRS-02 | Course count | Count visible courses (or check pagination total) | At least 30 courses | PASS — 34 courses | [ ] |
| CRS-03 | Difficulty labels correct | Check difficulty badges on cards | Only "foundational", "working", or "applied" — NO "beginner"/"intermediate"/"advanced" | PASS — no invalid levels | [ ] |
| CRS-04 | Card info complete | Inspect a course card | Shows id, title, slug, category, difficulty_level | PASS | [ ] |
| CRS-05 | Pagination | If >20 courses, click page 2 | Shows next set of courses | PASS — limit=5 returns exactly 5 | [ ] |
| CRS-06 | Category filter | Filter by "Banking & Finance" | Only banking courses shown, 11 results | PASS — 11 courses, all match | [ ] |
| CRS-07 | Difficulty filter | Filter by "Applied" | Only applied-level courses | PASS — 4 courses, all applied | [ ] |
| CRS-08 | Search | Type "AML" in search | Returns AML-related courses (>=1) | PASS — 3 results | [ ] |

### Screenshots Needed
- `CRS_catalog-full.png`
- `CRS-06_category-filter.png`
- `CRS-07_difficulty-filter.png`
- `CRS-08_search-results.png`

---

## Section 7: Categories (3/3 PASS)

### Test Cases

| ID | Scenario | Steps | Expected Result | API Result | Manual Status |
|----|----------|-------|-----------------|------------|---------------|
| CAT-01 | Categories listed | Check category filter options or sidebar | 10 categories available | PASS — 10 categories | [ ] |
| CAT-02 | Category data | Each category shows name and course count | Has id, name, slug, course_count | PASS | [ ] |
| CAT-03 | Banking & Finance populated | Click "Banking & Finance" category | Shows 11 courses | PASS — course_count=11 | [ ] |

### All Categories (verify these appear)
1. Banking & Finance (11 courses)
2. Insurance
3. Capital Markets
4. Regulatory & Compliance
5. Risk Management
6. Fintech & Digital
7. Leadership & Governance
8. Customer Experience
9. Technology
10. Professional Development

---

## Section 8: Course Detail Page (5/5 PASS)

**Page:** `/courses/:slug` (e.g., `/courses/aml-compliance`)

### Visual Checklist
- [ ] Course title and description
- [ ] Difficulty badge
- [ ] Module accordion/list
- [ ] Lesson list within each module
- [ ] "Enroll" or "Continue" button
- [ ] Progress indicator (if enrolled)
- [ ] Mobile responsive
- [ ] Screenshot: `DET_aml-detail.png`

### Test Cases

| ID | Scenario | Steps | Expected Result | API Result | Manual Status |
|----|----------|-------|-----------------|------------|---------------|
| DET-01 | AML course detail | Visit `/courses/aml-compliance` | Shows "Anti-Money Laundering Compliance" with modules and lessons | PASS — title correct | [ ] |
| DET-02 | Module structure | Check module list | 2 modules displayed | PASS — 2 modules | [ ] |
| DET-03 | Lesson count | Count lessons across modules | 5 total lessons | PASS — 5 lessons | [ ] |
| DET-04 | Enrollment status | Check enrollment indicator | Shows "enrolled" for demo user | PASS — enrollment_status=enrolled | [ ] |
| DET-05 | Non-existent course | Visit `/courses/fake-course-slug` | 404 page or "Course not found" message | PASS — 404 | [ ] |

### Screenshots Needed
- `DET_aml-detail.png`
- `DET-05_404-page.png`

---

## Section 9: Lesson Player / Content Tier Switching (10/10 PASS)

**Page:** `/courses/:slug/lessons/:lessonId`

This is the CORE feature — tiered content delivery. The same lesson has 3 different versions:
- **Foundational** — simplified, basics-first
- **Working** — standard professional level
- **Applied** — advanced, regulatory architecture level

### Visual Checklist
- [ ] Lesson title and module breadcrumb
- [ ] Content blocks render: text, quiz, scenario, artifact prompts
- [ ] Tier switcher visible (foundational / working / applied tabs/dropdown)
- [ ] Previous/Next lesson navigation
- [ ] Progress tracking indicator
- [ ] Mobile responsive — content reads well on phone
- [ ] Screenshot: `LES_lesson-player.png`

### Test Cases

| ID | Scenario | Steps | Expected Result | API Result | Manual Status |
|----|----------|-------|-----------------|------------|---------------|
| LES-01 | Foundational content | Open AML lesson 1, select "Foundational" tier | Content starts with "What Is Money Laundering?" — basic, intro-level | PASS — 6 blocks | [ ] |
| LES-02 | Working content | Switch to "Working" tier | Different, more detailed content | PASS | [ ] |
| LES-03 | Applied content | Switch to "Applied" tier | Starts with "Regulatory Architecture and Inter-Age..." — expert level | PASS | [ ] |
| LES-04 | Content differs across tiers | Compare foundational vs applied | Text is DIFFERENT — not the same content | PASS — confirmed different | [ ] |
| LES-05 | Auto-tier from persona | Clear tier selection, reload lesson | Auto-resolves to user's persona tier (foundational for demo) | PASS — tier=foundational | [ ] |
| LES-06 | Block types valid | Inspect content blocks | Types are: text_block, quiz_block (no invalid types) | PASS | [ ] |
| LES-07 | Quiz blocks complete | Open a quiz block | Has: question, options (choices), correct_answer, explanation | PASS — 3 quiz blocks valid | [ ] |
| LES-08 | Prev/Next navigation | Check navigation buttons | "Previous" and "Next" lesson buttons with correct links | PASS — prev=null (first lesson), next=present | [ ] |
| LES-09 | Old tier names rejected | (API) Try `?tier=beginner` | Server returns 400 error | PASS — 400 | [ ] |
| LES-10 | Free lesson no auth | Log out, visit first AML lesson directly | Content loads without login (first lesson is free) | PASS — 200 | [ ] |

### Screenshots Needed
- `LES-01_foundational-content.png`
- `LES-03_applied-content.png`
- `LES-04_side-by-side-comparison.png` (screenshot both tiers)
- `LES-07_quiz-block.png`
- `LES-08_prev-next-nav.png`
- `LES-10_free-lesson-no-auth.png`

---

## Section 10: Pricing / Subscription Plans (5/5 PASS)

**Page:** `/pricing`

### Visual Checklist
- [ ] 6 plan cards displayed
- [ ] Individual plans: Free, Professional Monthly, Professional Annual
- [ ] Corporate plans: Team Starter, Business, Enterprise
- [ ] Prices in NGN (Nigerian Naira)
- [ ] Feature lists on each card
- [ ] CTA buttons ("Get Started", "Contact Sales", etc.)
- [ ] Mobile responsive
- [ ] Screenshot: `PLAN_pricing-page.png`

### Test Cases

| ID | Scenario | Steps | Expected Result | API Result | Manual Status |
|----|----------|-------|-----------------|------------|---------------|
| PLAN-01 | Plans displayed | Visit `/pricing` | 6 plan cards visible | PASS — 6 plans | [ ] |
| PLAN-02 | Free plan | Check free plan card | Shows NGN 0, "Free Individual" | PASS | [ ] |
| PLAN-03 | Pro Monthly | Check Professional Monthly card | Shows NGN 2,500/month | PASS — 2500 | [ ] |
| PLAN-04 | Corporate plans | Check B2B section | 3 corporate plans visible | PASS — 3 corporate | [ ] |
| PLAN-05 | Feature lists | Click/expand each plan | Each plan has a non-empty features list | PASS | [ ] |

### Screenshots Needed
- `PLAN_pricing-page.png`
- `PLAN-02_free-plan-detail.png`
- `PLAN-04_corporate-plans.png`

---

## Section 11: Corporate Admin — Compliance Dashboard (5/5 PASS)

**Page:** `/admin` (login as `admin@firstbank-training.ng` / `admin1234`)

### Visual Checklist
- [ ] Dashboard overview with compliance status
- [ ] Traffic light indicators (red/yellow/green) per department
- [ ] Deadline display for regulatory requirements
- [ ] Top performers section
- [ ] Create new compliance requirement form
- [ ] Mobile responsive
- [ ] Screenshot: `COMP_admin-dashboard.png`

### Test Cases

| ID | Scenario | Steps | Expected Result | API Result | Manual Status |
|----|----------|-------|-----------------|------------|---------------|
| COMP-01 | Compliance overview | Login as admin → view compliance status | Requirements array loads | PASS — 1 requirement | [ ] |
| COMP-02 | AML CBN requirement | Check compliance requirement details | Shows regulatory_body=CBN, deadline=2026-08-22 | PASS | [ ] |
| COMP-03 | Department status | Check departments in requirement | 2 departments with traffic light status (yellow/yellow) | PASS | [ ] |
| COMP-04 | Top performers | Check performers section | Lists top performing employees | PASS — 1 performer | [ ] |
| COMP-05 | Create requirement | Use form to create new compliance requirement | Successfully created (201) | PASS | [ ] |

### Screenshots Needed
- `COMP_admin-dashboard.png`
- `COMP-02_cbn-requirement.png`
- `COMP-03_traffic-lights.png`
- `COMP-04_top-performers.png`

---

## Section 12: Credentials & CPD (2/2 PASS)

**Page:** `/credentials`

### Visual Checklist
- [ ] Credential cards/list
- [ ] CPD summary widget (professional body, hours required vs completed)
- [ ] Download/verify buttons (if applicable)
- [ ] Mobile responsive
- [ ] Screenshot: `CRED_credentials-page.png`

### Test Cases

| ID | Scenario | Steps | Expected Result | API Result | Manual Status |
|----|----------|-------|-----------------|------------|---------------|
| CRED-01 | List credentials | Login as learner → visit `/credentials` | Credentials list loads (may be empty for demo) | PASS — 200 | [ ] |
| CRED-02 | CPD summary | Check CPD summary for CIBN | Shows: professional_body=CIBN, required_hours=40 | PASS | [ ] |

### Screenshots Needed
- `CRED_credentials-page.png`
- `CRED-02_cpd-summary.png`

---

## Section 13: Course Enrollment (3/3 PASS)

### Test Cases

| ID | Scenario | Steps | Expected Result | API Result | Manual Status |
|----|----------|-------|-----------------|------------|---------------|
| ENR-01 | Enroll in course | As new user, click "Enroll" on a course | Success message, enrollment confirmed | PASS — 201 | [ ] |
| ENR-02 | Enrolled status shows | After enrolling, view course detail | Shows "Enrolled" status badge | PASS — enrollment_status=enrolled | [ ] |
| ENR-03 | Double-enroll | Click "Enroll" again on same course | Handled gracefully — shows already enrolled (409) or remains enrolled | PASS — 409 | [ ] |

### Screenshots Needed
- `ENR-01_enroll-success.png`
- `ENR-02_enrolled-badge.png`

---

## Section 14: Progress Tracking (2/2 PASS)

### Test Cases

| ID | Scenario | Steps | Expected Result | API Result | Manual Status |
|----|----------|-------|-----------------|------------|---------------|
| PRG-01 | Progress saves | Open a lesson, scroll through content | Progress auto-saves (50% at block 2, 120s spent) | PASS — 200 | [ ] |
| PRG-02 | Quiz answers recorded | Answer a quiz question in a lesson | Quiz answer saved with progress sync | PASS — 200 | [ ] |

### Screenshots Needed
- `PRG-01_progress-indicator.png`
- `PRG-02_quiz-answered.png`

---

## Section 15: Security (4/4 PASS)

| ID | Scenario | Steps | Expected Result | API Result | Manual Status |
|----|----------|-------|-----------------|------------|---------------|
| SEC-01 | SQL injection — search | Search for `' OR 1=1 --` in course search | Returns 0 results, no error | PASS — 200, safe | [ ] |
| SEC-02 | SQL injection — login | Try logging in with email `' OR 1=1 --` | Returns 400, no data leaked | PASS — 400 | [ ] |
| SEC-03 | XSS in name | Register with first_name `<script>alert("xss")</script>` | Name stored as plain text, React escapes on render — no script execution | PASS — stored safely | [ ] |
| SEC-04 | Rate limiting | Make 100+ rapid requests | Rate limiter kicks in at 100/min globally | PASS — rate limiter active | [ ] |

### Screenshots Needed
- `SEC-01_sql-injection-safe.png`
- `SEC-03_xss-escaped.png` (show the name rendering without script execution)

---

## Section 16: Edge Cases (5/5 PASS)

| ID | Scenario | Steps | Expected Result | API Result | Manual Status |
|----|----------|-------|-----------------|------------|---------------|
| EDGE-01 | Long search query | Paste 1000 characters into search | Handles gracefully, no crash | PASS — 200 | [ ] |
| EDGE-02 | Negative page | Try page=-1 in URL | Handled (returns 400 or defaults to page 1) | PASS — 400 | [ ] |
| EDGE-03 | Huge limit | Try limit=9999 in URL | Capped at reasonable amount (<=100) | PASS | [ ] |
| EDGE-04 | Empty body | Submit login with completely empty body | Returns 400, doesn't crash | PASS — 400 | [ ] |
| EDGE-05 | Unicode in search | Search for "naïra₦" | Handles gracefully, no crash | PASS — 200 | [ ] |

---

## Section 17: Frontend Routes — Full Walkthrough

Walk through EVERY route on the platform and verify it renders correctly.

| # | Route | Page | Login Required | What to Check | Screenshot |
|---|-------|------|----------------|---------------|------------|
| 1 | `/login` | Login | No | Form renders, link to register | `ROUTE_login.png` |
| 2 | `/register` | Registration | No | Form renders, consent checkboxes, link to login | `ROUTE_register.png` |
| 3 | `/onboarding` | Persona Gateway | Yes | 3-screen flow, 4 persona cards, calibration questions | `ROUTE_onboarding.png` |
| 4 | `/` | Dashboard | Yes | Welcome message, enrolled courses, progress, recommendations | `ROUTE_dashboard.png` |
| 5 | `/courses` | Course Catalog | No | Grid of courses, filters, search, pagination | `ROUTE_courses.png` |
| 6 | `/courses/aml-compliance` | Course Detail | No | Title, modules, lessons, enroll button | `ROUTE_course-detail.png` |
| 7 | `/courses/aml-compliance/lessons/:id` | Lesson Player | Partial | Content blocks, tier switcher, quiz, nav | `ROUTE_lesson-player.png` |
| 8 | `/pricing` | Pricing | No | 6 plans, features, CTA buttons | `ROUTE_pricing.png` |
| 9 | `/credentials` | Credentials | Yes | Credential list, CPD summary | `ROUTE_credentials.png` |
| 10 | `/admin` | Admin Dashboard | Yes (admin) | Compliance, performers, requirements | `ROUTE_admin.png` |
| 11 | `/profile` | User Profile | Yes | Name, email, persona, tier | `ROUTE_profile.png` |
| 12 | `/verify/:credentialId` | Credential Verify | No | Public credential verification | `ROUTE_verify.png` |

---

## Section 18: Mobile Responsiveness

Test each route at these breakpoints:

| Breakpoint | Width | What to Check |
|-----------|-------|---------------|
| Mobile S | 320px | Everything fits, no horizontal scroll |
| Mobile M | 375px | Standard iPhone — primary test target |
| Mobile L | 425px | Larger phones |
| Tablet | 768px | Two-column layouts kick in |
| Desktop | 1024px+ | Full layout |

For each route, take one screenshot at 375px and one at 1024px:
- `MOBILE_{route-name}_375.png`
- `DESKTOP_{route-name}_1024.png`

---

## Section 19: PWA / Offline Behavior

| # | Scenario | Steps | Expected Result | Screenshot |
|---|----------|-------|-----------------|------------|
| 1 | Install prompt | Visit site on mobile Chrome | "Add to Home Screen" banner or install icon | `PWA_install-prompt.png` |
| 2 | App icon | Install PWA, check home screen | SABIficate icon with correct name | `PWA_home-screen-icon.png` |
| 3 | Splash screen | Open installed PWA | Branded splash screen appears | `PWA_splash.png` |
| 4 | Offline page | Turn off network → navigate | Offline fallback page, not Chrome dinosaur | `PWA_offline.png` |
| 5 | Service worker update | Clear cache, reload | Auto-updates without manual refresh | `PWA_sw-update.png` |

---

## Bugs Found & Fixed (This Sprint)

| # | Severity | Description | Root Cause | Fix | Status |
|---|----------|-------------|-----------|-----|--------|
| 1 | HIGH | AML course difficulty_level was "intermediate" | Seed data used old enum | Changed to "working" in seed.ts | FIXED |
| 2 | CRITICAL | Paywall SQL crashes on pg-mem | `INTERVAL * $n` not supported | Hardcoded `INTERVAL '7 days'` | FIXED |
| 3 | HIGH | Client filter stripped all text blocks | `filterBlocksByTier` was filtering on field that doesn't differentiate | Made passthrough (server handles tier) | FIXED |
| 4 | MEDIUM | All AML lessons behind paywall | `is_free` defaulted to false | Added `is_free` for first lesson per module | FIXED |
| 5 | HIGH | Tier query rejected valid values | `lessonContentQuerySchema` used old enum | Updated to foundational/working/applied | FIXED |
| 6 | HIGH | Course list difficulty filter broken | `courseListSchema` still had beginner/intermediate/advanced | Updated to foundational/working/applied | FIXED |
| 7 | MEDIUM | Invalid persona slug accepted | No server-side validation | Added DB lookup before persona insert | FIXED |

---

## Known Open Issues

| # | Severity | Description | Notes |
|---|----------|-------------|-------|
| 1 | LOW | Quiz blocks still reference old difficulty values internally | Cosmetic — doesn't affect rendering |
| 2 | MEDIUM | Pilot setup route requires auth but meant for self-serve | B2B pilot signup flow needs design decision |
| 3 | LOW | Technology category has 0 courses | Content gap — needs course authoring |
| 4 | INFO | Rate limiting is 100/min global, no per-endpoint login throttle | Recommend adding 10/min on login endpoint |
| 5 | INFO | XSS content stored as-is in DB | Safe because React escapes on render, but server-side sanitization recommended |

---

## Improvement Areas

### UI/UX
- [ ] Add loading skeletons for course catalog
- [ ] Add error boundary with user-friendly fallback
- [ ] Add toast notifications for enrollment/progress saves
- [ ] Add "Back to courses" breadcrumb on lesson player
- [ ] Add progress bar in course detail (% complete)

### Content
- [ ] Add courses to Technology category (currently empty)
- [ ] Add more lesson content beyond AML (other seeded courses have structure but no tiered content)
- [ ] Expand quiz blocks beyond foundational tier

### Security
- [ ] Add per-endpoint rate limiting for login (10 attempts/min)
- [ ] Add server-side HTML sanitization for user inputs
- [ ] Add CSRF protection tokens
- [ ] Add password strength meter on registration form

### Performance
- [ ] Add API response caching for course catalog
- [ ] Add image optimization/lazy loading
- [ ] Add bundle size analysis

---

## Sign-Off

| Role | Name | Date | Status |
|------|------|------|--------|
| Automated Tests | API Suite v3 | 2026-06-23 | 84/84 PASS (100%) |
| Manual QA | Clark / Quaco | ____________ | _____ / 84 + Routes |
| Product Owner | Sanju | ____________ | ________ |

---

*Generated by SABIficate automated test suite. Test script: `/workspace/app/scripts/api-test-suite.ts`*
