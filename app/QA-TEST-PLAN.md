# SABIficate QA Test Plan — Manual Browser Testing

**Version:** 1.0
**Date:** 2026-07-20
**Platform:** https://sabificate.forwardai.dev
**Reference screenshots:** `/sabificate/qa-reference-screenshots/` (20 baseline images)

---

## How to use this document

1. Open each test case in order
2. Follow the steps exactly as written
3. At each **[SCREENSHOT]** marker, take a screenshot and save it with the filename shown
4. Compare your screenshot against the reference image listed
5. In the **Result** column, mark PASS, FAIL, or NOTE (with details)
6. After all tests, fill in the **Improvement Observations** section at the bottom

### Test accounts

| Role | Email | Password |
|------|-------|----------|
| Learner | demo@sabificate.com | demo1234 |
| Corporate Admin | admin@firstbank-training.ng | admin1234 |
| Platform Admin | platform@sabificate.com | staff1234 |
| Curriculum Author | author@sabificate.com | staff1234 |
| SME Reviewer | reviewer@sabificate.com | staff1234 |

### Device targets

Test on at minimum:
- Mobile: iPhone 14 / Samsung Galaxy S23 (or Chrome DevTools 390x844)
- Desktop: 1440x900

---

## SECTION A: Authentication & Access Control

### TC-A01: Login — Happy Path (Learner)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open https://sabificate.forwardai.dev/login | Login page loads. "SABIficate / Professional Microlearning" header visible. Email and password fields, "Sign in" button, "Create account" link, test accounts table all visible. |
| 2 | **[SCREENSHOT: A01-login-page.png]** | Compare with `01-login.png` |
| 3 | Enter `demo@sabificate.com` / `demo1234` | Fields accept input, password is masked |
| 4 | Click "Sign in" | Button shows "Signing in..." briefly, then redirects to Dashboard |
| 5 | Verify Dashboard loads | "Welcome back, Demo" heading. Stats grid (Lessons Done, Courses Completed, Learning Time, Day Streak). "In Progress" section shows "Anti-Money Laundering Compliance" course at 0%. Bottom nav bar: Home, Courses, Credentials, Profile. |
| 6 | **[SCREENSHOT: A01-learner-dashboard.png]** | Compare with `02-learner-dashboard.png` |

**Result:** ____

---

### TC-A02: Login — Wrong Password

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open /login | Login page loads |
| 2 | Enter `demo@sabificate.com` / `wrongpassword` | Fields accept input |
| 3 | Click "Sign in" | Red error banner appears: "Invalid email or password" (or similar). User stays on login page. No redirect. |
| 4 | **[SCREENSHOT: A02-wrong-password.png]** | Error banner visible, form still showing |

**Result:** ____

---

### TC-A03: Login — Empty Fields

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open /login | Login page loads |
| 2 | Click "Sign in" without entering anything | Browser validation prevents submission (HTML5 required attribute). No network request fires. |
| 3 | Enter email only, click "Sign in" | Browser validation stops at empty password field |

**Result:** ____

---

### TC-A04: Registration — Happy Path

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open /login, click "Create account" | Navigates to /register. "Create account" heading. Fields: First name, Last name, Email, Password, Phone (optional). Three consent checkboxes. "Create account" button. "Already have an account? Sign in" link. |
| 2 | **[SCREENSHOT: A04-register-page.png]** | Registration form visible with all fields |
| 3 | Fill: First=Test, Last=User, Email=testuser-TIMESTAMP@test.com, Password=testing123 | All fields accept input |
| 4 | Ensure "educational purposes" checkbox is checked | First checkbox should be pre-checked |
| 5 | Click "Create account" | Button shows "Creating account...", then redirects to / (Dashboard) or /onboarding |
| 6 | **[SCREENSHOT: A04-register-success.png]** | User is logged in and on dashboard or onboarding |

**Result:** ____

---

### TC-A05: Registration — Validation Errors

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open /register | Form loads |
| 2 | Enter password `short` (under 8 chars), fill other fields, submit | Error: "Password must be at least 8 characters." |
| 3 | Enter password `abcdefgh` (no number), submit | Error: "Password must contain at least one number." |
| 4 | Uncheck "educational purposes" consent, use valid password, submit | Error: "You must consent to educational data use to create an account." |
| 5 | **[SCREENSHOT: A05-register-validation.png]** | Error banner visible |

**Result:** ____

---

### TC-A06: Registration — Duplicate Email

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open /register | Form loads |
| 2 | Fill with email `demo@sabificate.com` (existing account), valid password | Fields accept input |
| 3 | Submit | Error message about email already existing. User stays on registration page. |
| 4 | **[SCREENSHOT: A06-duplicate-email.png]** | Error banner visible |

**Result:** ____

---

### TC-A07: Login — Redirect After Auth

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | While logged out, navigate to /profile | Should redirect to /login?redirect=/profile (or show sign-in prompt) |
| 2 | Log in with learner credentials | After login, should redirect to /profile (not /) |

**Result:** ____

---

### TC-A08: Logout

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as any user | Dashboard loads |
| 2 | Navigate to /profile | Profile page loads |
| 3 | Click "Sign Out" button (red, bottom of page) | User is logged out and redirected to login page or unauthenticated home |
| 4 | Try navigating to /profile | Should show sign-in prompt, not profile data |
| 5 | **[SCREENSHOT: A08-logged-out.png]** | Logged out state confirmed |

**Result:** ____

---

### TC-A09: Role-Based Route Guards

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as **learner** (demo@sabificate.com) | Dashboard loads |
| 2 | Navigate to /admin | Should redirect away or show "Access Denied" — learner cannot see admin panel |
| 3 | Navigate to /studio | Should redirect away — learner cannot see studio |
| 4 | Navigate to /catalog | Should redirect away — learner cannot see concept catalog |
| 5 | Log out. Log in as **corporate_admin** (admin@firstbank-training.ng) | Dashboard loads |
| 6 | Navigate to /admin | Admin Dashboard loads with stats, learners table |
| 7 | Navigate to /studio | Curriculum Studio loads |
| 8 | **[SCREENSHOT: A09-admin-access.png]** | Admin can see admin panel |
| 9 | Log out. Log in as **sme_reviewer** (reviewer@sabificate.com) | Dashboard loads |
| 10 | Navigate to /admin | Should redirect away — reviewer cannot see admin |
| 11 | Navigate to /studio | Curriculum Studio loads (read access) |
| 12 | **[SCREENSHOT: A09-reviewer-studio.png]** | Compare with `18-reviewer-studio.png` |

**Result:** ____

---

## SECTION B: Onboarding Flow (Learner Only)

### TC-B01: Full Onboarding — Recent Graduate Path

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as learner (demo@sabificate.com) | Dashboard loads |
| 2 | Navigate to /onboarding | Page loads with header "Which sounds like you?" and subtitle. Step indicator shows 1 of 3 (first dot filled). Four persona cards visible: Recent Graduate (green), Working Professional (blue), Team Lead / Manager (purple), Senior Specialist (amber). Each has icon, title, description. |
| 3 | **[SCREENSHOT: B01-personas.png]** | Compare with `03-onboarding-personas.png` |
| 4 | Click "Recent Graduate" | Advances to Screen 2. "Quick check" heading. "Back" link at top. Question: "How familiar are you with financial statements?" Three radio options. "Continue" button (disabled until selection). Step indicator: 2 of 3. |
| 5 | **[SCREENSHOT: B01-calibration.png]** | Compare with `04-onboarding-calibration.png` |
| 6 | Click "I've never seen one" | Option highlights blue with filled radio dot. "Continue" button becomes active (solid blue). |
| 7 | **[SCREENSHOT: B01-selected.png]** | Compare with `05-onboarding-answer-selected.png` |
| 8 | Click "Continue" | Advances to Screen 3. "Your learning path" heading. Blue card showing "Foundational" tier with lightning icon and description. "Change my level" link below. "Continue to Dashboard" button. Step indicator: 3 of 3. |
| 9 | **[SCREENSHOT: B01-result.png]** | Compare with `06-onboarding-result.png` |
| 10 | Click "Continue to Dashboard" | Redirects to / (Dashboard). Button shows "Saving..." briefly. |
| 11 | **[SCREENSHOT: B01-final-dashboard.png]** | Dashboard loads without onboarding redirect |

**Result:** ____

---

### TC-B02: Onboarding — Change Level Override

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate through onboarding to Screen 3 (tier result) | Shows assigned tier (e.g., "Foundational") |
| 2 | Click "Change my level" | Three tier buttons appear: Foundational, Working, Applied. Currently selected one is highlighted blue. |
| 3 | Click "Applied" | "Applied" button highlights blue. The card above should now say "Applied" with its description. |
| 4 | Click "Continue to Dashboard" | Saves the overridden tier, redirects to Dashboard |
| 5 | **[SCREENSHOT: B02-override.png]** | Override options visible |

**Result:** ____

---

### TC-B03: Onboarding — Back Button

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to /onboarding | Persona screen (Screen 1) |
| 2 | Click any persona | Advances to calibration (Screen 2) |
| 3 | Click "Back" (top left) | Returns to Screen 1 (persona selection). Previously selected persona is NOT pre-selected (clean slate). |

**Result:** ____

---

### TC-B04: Staff Roles Skip Onboarding

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as **corporate_admin** | Dashboard loads directly — NO redirect to /onboarding |
| 2 | Log in as **platform_admin** | Dashboard loads directly |
| 3 | Log in as **curriculum_author** | Dashboard loads directly |
| 4 | Log in as **sme_reviewer** | Dashboard loads directly |
| 5 | **[SCREENSHOT: B04-staff-dashboard.png]** | Any staff role shows dashboard, not onboarding |

**Result:** ____

---

## SECTION C: Course Catalog & Detail

### TC-C01: Course Catalog Page

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as learner | Dashboard loads |
| 2 | Tap "Courses" in bottom nav | /courses loads. "Course Catalog" heading. Search bar. Category dropdown ("All Categories (33)"). Level dropdown ("All Levels (33)"). Shows "1 course". AML Compliance course card with gradient background, title, "Banking & Finance" tag, "Working" level tag, "2 hrs", "5 lessons". |
| 3 | **[SCREENSHOT: C01-catalog.png]** | Compare with `07-courses.png` |
| 4 | Type "money" in search bar | Course should filter — AML course still visible (matches "Money" in title). If no match, should show empty state. |
| 5 | Clear search, change Category dropdown | Dropdown opens with category options. Filtering should work. |

**Result:** ____

---

### TC-C02: Course Detail Page

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | From catalog, click "Anti-Money Laundering Compliance" | /courses/aml-compliance loads. Breadcrumb: "Courses / Anti-Money Laundering Compliance". Full title, description about ML(P&P) Act 2022. Tags: Banking & Finance, Working, 2 hrs, 4 CPD hrs, CIBN. Progress bar (0/0 lessons, 0%). "Continue Learning" button. "What you will learn" section with 4 bullet points. "Course Content" section with 2 modules, 5 total lessons. |
| 2 | **[SCREENSHOT: C02-course-detail.png]** | Compare with `08-course-detail.png` |
| 3 | Check module expansion | Module 1 "Foundations of AML in Nigeria" (3 lessons) and Module 2 "Transaction Monitoring & SAR Filing" (2 lessons). Each lesson shows title, Quiz icon, duration (25 min or 20 min). |
| 4 | Click "Continue Learning" | Should navigate to first lesson or enrollment action |

**Result:** ____

---

### TC-C03: Course Enrollment

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | From course detail, click "Continue Learning" | If not enrolled, should trigger enrollment. If already enrolled, goes to first incomplete lesson. |
| 2 | After enrollment, check Dashboard | "In Progress" section should show this course with 0% progress |

**Result:** ____

---

## SECTION D: Lesson Player

### TC-D01: Open a Lesson

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | From course detail, click any lesson (e.g., "Introduction to AML Framework...") | /courses/aml-compliance/lessons/LESSON_ID loads. Lesson content renders (text blocks, quiz blocks, etc.) OR shows appropriate error if content isn't generated yet. Loading spinner appears while fetching. |
| 2 | **[SCREENSHOT: D01-lesson-player.png]** | Lesson content or appropriate message visible |

**Result:** ____

---

### TC-D02: Lesson — Unauthenticated Access

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log out | Logged out state |
| 2 | Navigate directly to a lesson URL | Should show "Sign in to access this lesson" with a "Sign In" link that preserves the redirect URL |
| 3 | **[SCREENSHOT: D02-lesson-unauth.png]** | Sign-in prompt visible |

**Result:** ____

---

## SECTION E: Profile

### TC-E01: Profile Page — View

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as learner, tap "Profile" in bottom nav | /profile loads. Avatar circle with initials "DL". Name "Demo Learner". Email "demo@sabificate.com". Role badge "Learner" (blue pill). Data Usage Mode section with 3 options: Full Quality, Data Saver, Ultra Light. Account section: Language (English), Organization (Linked). "Sign Out" button (red). |
| 2 | **[SCREENSHOT: E01-profile.png]** | Compare with `09-profile.png` |

**Result:** ____

---

### TC-E02: Data Saver Mode Toggle

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | On profile page, note current active mode | One option shows "Active" badge |
| 2 | Click "Full Quality" | Full Quality highlights with blue border, shows "Active". Previous selection deselects. |
| 3 | Click "Ultra Light" | Ultra Light highlights. Mode persists across navigation — go to /courses and back to /profile, Ultra Light should still be selected. |
| 4 | Check top nav bar | "Data Saver" indicator in header should reflect the mode |

**Result:** ____

---

### TC-E03: Profile — All Roles Show Correct Identity

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as corporate_admin, go to /profile | Shows "FirstBank Admin", admin@firstbank-training.ng, role "Corporate Admin" |
| 2 | Log in as platform_admin, go to /profile | Shows "Sanju Platform", platform@sabificate.com, role "Platform Admin" |
| 3 | Log in as curriculum_author, go to /profile | Shows "Gbitse Author", author@sabificate.com, role "Curriculum Author" |
| 4 | Log in as sme_reviewer, go to /profile | Shows "Mark Reviewer", reviewer@sabificate.com, role "Sme Reviewer" |
| 5 | **[SCREENSHOT: E03-profile-roles.png]** | Each role shows correct identity |

**Result:** ____

---

## SECTION F: Credentials

### TC-F01: Credentials — Empty State

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as learner, tap "Credentials" in bottom nav | /credentials loads. "My Credentials" heading. Empty state: graduation cap icon, "No credentials yet", "Complete a course to earn your first credential". |
| 2 | **[SCREENSHOT: F01-credentials-empty.png]** | Compare with `10-credentials.png` |

**Result:** ____

---

### TC-F02: Credentials — Unauthenticated

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log out | Logged out |
| 2 | Navigate to /credentials | Should show "Sign in to view your credentials" with Sign In link. NOT an error banner. |
| 3 | **[SCREENSHOT: F02-credentials-unauth.png]** | Clean sign-in prompt, not error |

**Result:** ____

---

## SECTION G: Pricing

### TC-G01: Pricing Page — Full Plan Display

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as learner, navigate to /pricing | "Choose Your Plan" heading. "No active subscription" banner. **Individual plans:** Free Individual (NGN 0/month, 3 features, "Current Plan" button), Professional Monthly (NGN 2,500/month, "Most Popular" badge, 4 features, "Subscribe" button), Professional Annual (NGN 24,000/year, "Save NGN 6,000" note, "Subscribe" button). **Organization plans:** "For Organizations" section header, Compliance Essentials (NGN 3,500/seat/month), Professional (NGN 5,500/seat/month), Enterprise (NGN 8,000/seat/month, "Contact Sales" button). |
| 2 | **[SCREENSHOT: G01-pricing.png]** | Compare with `11-pricing.png` |
| 3 | Check all prices display in NGN format | Prices use comma separators where applicable, NGN prefix |
| 4 | Click "Subscribe" on Professional Monthly | Should open Paystack checkout modal (or redirect). Shows plan name, price, "Pay with Paystack" button. |
| 5 | **[SCREENSHOT: G01-checkout-modal.png]** | Paystack checkout modal visible |
| 6 | Close the modal (X button) | Modal closes, back to pricing page |

**Result:** ____

---

## SECTION H: Admin Dashboard (Corporate Admin)

### TC-H01: Admin Panel — Overview Stats

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as corporate_admin (admin@firstbank-training.ng) | Dashboard loads |
| 2 | Navigate to /admin | "Admin Dashboard" heading. "Upload CSV" button. Stats grid: Total Learners (2), Active (30D) (0), Completion Rate (0%), Avg Score (0%). |
| 3 | **[SCREENSHOT: H01-admin-overview.png]** | Compare with `13-admin-panel.png` |

**Result:** ____

---

### TC-H02: Admin Panel — Compliance Status

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | On /admin page, scroll to "Compliance Status" | Shows "Anti-Money Laundering Compliance" with "CBN" regulatory body, deadline date. Department compliance breakdown: Compliance dept and Operations dept with status indicators (yellow/red/green dots). |
| 2 | **[SCREENSHOT: H02-compliance.png]** | Compliance cards visible with department stats |

**Result:** ____

---

### TC-H03: Admin Panel — Learner Table

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | On /admin page, check Learner Table | Table headers: Name, Courses. Shows "FirstBank Admin" (0 courses) and "Demo Learner" (1 course). |
| 2 | Type in search bar "Demo" | Table filters to show only "Demo Learner" |
| 3 | Clear search | All learners reappear |
| 4 | **[SCREENSHOT: H03-learner-table.png]** | Learner table with data |

**Result:** ____

---

### TC-H04: Admin Panel — Top Performers

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | On /admin page, scroll to "Top Performers" | Table with columns: #, Name, Completed, Avg Score. Shows ranked list of learners. |
| 2 | **[SCREENSHOT: H04-top-performers.png]** | Top performers table visible |

**Result:** ____

---

### TC-H05: Admin — CSV Upload

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | On /admin page, click "Upload CSV" button | Upload interface opens (modal or inline). Should accept CSV file. |
| 2 | **[SCREENSHOT: H05-csv-upload.png]** | Upload interface visible |

**Result:** ____

---

## SECTION I: Curriculum Studio

### TC-I01: Studio — Author View (Empty State)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as curriculum_author, navigate to /studio | "Curriculum Studio" heading. "Concept Catalog" link. "+ New Track" button (blue). "7-stage authoring pipeline for course creation" subtitle. Empty state: "No authoring tracks yet / Create your first track to get started." |
| 2 | **[SCREENSHOT: I01-studio-empty.png]** | Compare with `16-author-studio.png` |

**Result:** ____

---

### TC-I02: Studio — Create New Track

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | On /studio, click "+ New Track" | Track creation form/modal appears. Fields: Name, Vertical (dropdown), Customer Tier (dropdown), and other configuration options. |
| 2 | Fill: Name="Test AML Course", Vertical="financial-literacy", Customer Tier="freemium" | Fields accept input |
| 3 | Submit | New track appears in the track list with "draft" status |
| 4 | **[SCREENSHOT: I02-new-track.png]** | New track card visible in studio |

**Result:** ____

---

### TC-I03: Studio — SME Reviewer View

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as sme_reviewer, navigate to /studio | Studio loads. Should see track list (empty or with tracks). Reviewer should be able to view tracks but may have limited editing ability. |
| 2 | **[SCREENSHOT: I03-reviewer-studio.png]** | Compare with `18-reviewer-studio.png` |

**Result:** ____

---

### TC-I04: Concept Catalog

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as curriculum_author, navigate to /catalog | Concept Catalog page loads. Search bar. Domain filter. List of concepts (may be empty). "Add Concept" option available. |
| 2 | **[SCREENSHOT: I04-concept-catalog.png]** | Concept catalog page visible |

**Result:** ____

---

## SECTION J: Navigation & Layout

### TC-J01: Bottom Navigation Bar

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as learner | Bottom nav visible: Home, Courses, Credentials, Profile (4 icons) |
| 2 | Tap each nav item | Each navigates to correct page. Active tab is highlighted (different color/weight). |
| 3 | Check header bar | Shows "SABIficate" logo, "Studio" link (if role allows), "Data Saver" indicator, sync status |
| 4 | **[SCREENSHOT: J01-nav-bar.png]** | Both nav bars visible |

**Result:** ____

---

### TC-J02: Navigation — Staff Top Bar

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as corporate_admin | Top bar shows: SABIficate, Studio link, Data Saver, Synced indicator |
| 2 | Click "Studio" in top bar | Navigates to /studio |
| 3 | Check bottom nav items are same as learner | Home, Courses, Credentials, Profile |

**Result:** ____

---

### TC-J03: 404 Handling

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to /nonexistent-page | Should redirect to / (Dashboard) — not show a broken page or error |
| 2 | **[SCREENSHOT: J03-404-redirect.png]** | Dashboard loads (redirected from 404) |

**Result:** ____

---

## SECTION K: Edge Cases & Security

### TC-K01: Session Persistence (Page Refresh)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as learner | Dashboard loads |
| 2 | Hard refresh (Ctrl+Shift+R) | Dashboard reloads without requiring re-login. User stays authenticated. |
| 3 | Navigate to /profile, refresh | Profile data still visible, still authenticated |

**Result:** ____

---

### TC-K02: Multiple Tab Behavior

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as learner in Tab 1 | Dashboard loads |
| 2 | Open Tab 2 to same site | Should be authenticated (shared session) |
| 3 | Log out in Tab 1 | Tab 1 redirects to login |
| 4 | Refresh Tab 2 | Should also be logged out |

**Result:** ____

---

### TC-K03: No Data Downloads/Exports Visible

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Check ALL pages as ALL roles | No "Download", "Export", "CSV Export", or data download buttons should be visible anywhere in the UI for any role. The "Upload CSV" button in Admin is for IMPORT only (not export). |
| 2 | Check Credentials page | No "Download PDF" or export option visible |
| 3 | Check Admin page | No "Export learners" or "Download report" visible |

**Result:** ____

---

### TC-K04: No Agent Protocols Visible

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Check ALL dashboard/admin views | No references to "agent", "protocol", "AI pipeline", or internal system architecture should be visible to any user in any UI screen. |
| 2 | Check Studio page | Studio shows authoring tools only — no internal pipeline names or AI system references exposed to end users |

**Result:** ____

---

### TC-K05: API Endpoint Security

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open browser DevTools > Network tab | Monitor API calls |
| 2 | As learner, try navigating to /admin | Should not see any admin API calls succeed (403 responses) |
| 3 | Check no sensitive data in console | No tokens, passwords, or internal errors visible in browser console |

**Result:** ____

---

## SECTION L: Cross-Role Dashboard Behavior

### TC-L01: Learner Dashboard Content

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as learner | "Welcome back, Demo". Stats grid. In Progress shows enrolled courses. If no courses: "No courses enrolled yet / Browse Courses" link. |
| 2 | **[SCREENSHOT: L01-learner-home.png]** | Learner dashboard with stats |

**Result:** ____

---

### TC-L02: Corporate Admin Dashboard

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as corporate_admin | "Welcome back, FirstBank". Same learner-facing dashboard (since admin is also a user). Stats grid. Admin-specific content accessible via /admin route, not mixed into home dashboard. |
| 2 | **[SCREENSHOT: L02-admin-home.png]** | Compare with `12-admin-dashboard.png` |

**Result:** ____

---

### TC-L03: All Staff Skip Onboarding

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as each staff role in sequence | Each should land on Dashboard directly, never redirected to /onboarding |
| 2 | Verify for: corporate_admin, platform_admin, curriculum_author, sme_reviewer | All four land on Dashboard |

**Result:** ____

---

## SECTION M: Responsive & Mobile UX

### TC-M01: Mobile Layout (390x844)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Set browser to 390x844 (iPhone 14) using DevTools | Viewport resizes |
| 2 | Check login page | Form is centered, fields are full-width, touch targets are at least 44px tall |
| 3 | Check course catalog | Course cards stack vertically, search bar is full-width |
| 4 | Check admin dashboard | Stats grid is 2-column, tables scroll horizontally if needed |
| 5 | Check pricing page | Plan cards stack vertically |
| 6 | **[SCREENSHOT: M01-mobile-layout.png]** | Clean mobile layout, no overflow/cut-off |

**Result:** ____

---

### TC-M02: Desktop Layout (1440x900)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Set browser to 1440x900 | Viewport resizes |
| 2 | Check all major pages | Content is centered, max-width applied, not stretched edge-to-edge |
| 3 | **[SCREENSHOT: M02-desktop-layout.png]** | Clean desktop layout |

**Result:** ____

---

## SECTION N: PWA & Offline Indicators

### TC-N01: Sync Status Indicator

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | While logged in, check top bar | "Synced" indicator visible (green dot) when online |
| 2 | Disconnect network (DevTools > Network > Offline) | Sync indicator should change to show offline state |
| 3 | Reconnect network | Sync indicator returns to "Synced" |

**Result:** ____

---

## SECTION O: Public Pages

### TC-O01: Unauthenticated Home Page

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log out, navigate to / | "Welcome to SABIficate" heading. "Professional microlearning for Nigerian working professionals" subtitle. "Sign In" button (blue). "Create Account" button (outlined). "Browse Courses" link. |
| 2 | **[SCREENSHOT: O01-public-home.png]** | Public landing page |

**Result:** ____

---

### TC-O02: Public Course Browsing

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | While logged out, navigate to /courses | Course catalog loads. Courses visible. Search and filters work. |
| 2 | Click a course | Course detail page loads. Lessons listed. "Continue Learning" may prompt sign-in. |

**Result:** ____

---

## Summary & Sign-Off

### Test Execution Log

| Section | Total Cases | Pass | Fail | Notes |
|---------|-------------|------|------|-------|
| A: Auth & Access | 9 | | | |
| B: Onboarding | 4 | | | |
| C: Courses | 3 | | | |
| D: Lesson Player | 2 | | | |
| E: Profile | 3 | | | |
| F: Credentials | 2 | | | |
| G: Pricing | 1 | | | |
| H: Admin Dashboard | 5 | | | |
| I: Curriculum Studio | 4 | | | |
| J: Navigation | 3 | | | |
| K: Edge Cases & Security | 5 | | | |
| L: Cross-Role Dashboard | 3 | | | |
| M: Responsive | 2 | | | |
| N: PWA | 1 | | | |
| O: Public Pages | 2 | | | |
| **TOTAL** | **49** | | | |

---

## Improvement Observations

While testing, note any areas where the UX could be better. Record them here:

### Visual / Design
- [ ] _e.g., "Pricing cards too close together on mobile"_
- [ ] ____
- [ ] ____

### Usability
- [ ] _e.g., "No confirmation after onboarding submit — unclear if it saved"_
- [ ] ____
- [ ] ____

### Missing Features
- [ ] _e.g., "No way to change persona after initial onboarding"_
- [ ] ____
- [ ] ____

### Bugs Found
- [ ] _e.g., "Double-tap on Submit button sends two requests"_
- [ ] ____
- [ ] ____

### Performance
- [ ] _e.g., "Course detail page takes 3+ seconds to load"_
- [ ] ____
- [ ] ____

---

**Tested by:** ________________
**Date:** ________________
**Device(s):** ________________
**Browser(s):** ________________
