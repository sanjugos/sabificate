# SABIficate Coworker Frontend Audit

> **Target**: https://sabificate.forwardai.dev
> **Test Accounts**:
> - Learner: `demo@sabificate.com` / `demo1234`
> - Corporate Admin: `admin@firstbank-training.ng` / `admin1234`
> **Last Updated**: 2026-06-24

## How to use this file

Each test case has an **ID**, **action**, and **expected result**. Open the URL in a browser, perform the action, take a screenshot, and compare against the expected result. Mark PASS/FAIL.

**IMPORTANT — Security constraints to verify throughout:**
- NO download buttons anywhere (no PDF, PNG, CSV, data export of any kind)
- NO agent protocols / AI internals visible in any UI
- NO "Forgot password?" link on login page

---

## Section 1: Login Page (`/login`)

### 1.01 — Page load
- **Action**: Navigate to `/login`
- **Expected**:
  - White page with centered form, max-width ~384px
  - Heading: **"Sign in"** — text-2xl, bold, centered, gray-900
  - Two input fields with labels "Email" and "Password"
  - Blue **"Sign in"** button full-width below inputs
  - **"Create account"** link at bottom-right, blue text
  - NO "Forgot password?" link anywhere on the page

### 1.02 — Empty form submission
- **Action**: Click "Sign in" without entering anything
- **Expected**: Browser native validation fires on email field ("Please fill out this field")

### 1.03 — Invalid credentials
- **Action**: Enter `wrong@test.com` / `wrongpass`, click Sign in
- **Expected**:
  - Red error banner appears above inputs
  - Banner: rounded-lg, border-red-300, bg-red-50, text-red-700
  - Text: "Login failed" or similar error message
  - Button returns to "Sign in" (not stuck on "Signing in...")

### 1.04 — Valid learner login
- **Action**: Enter `demo@sabificate.com` / `demo1234`, click Sign in
- **Expected**:
  - Button text changes to **"Signing in..."** while submitting
  - Redirects to Dashboard (`/`) on success
  - Dashboard shows "Welcome back, Demo" (or first name of demo user)

### 1.05 — Valid admin login
- **Action**: Enter `admin@firstbank-training.ng` / `admin1234`, click Sign in
- **Expected**: Redirects to Dashboard, shows welcome message with admin's first name

### 1.06 — Email input details
- **Action**: Click into email field
- **Expected**:
  - Placeholder: "you@example.com"
  - Min-height 44px (touch-friendly)
  - Border turns blue-500 on focus with ring
  - Input type is `email` (keyboard shows @ on mobile)

### 1.07 — Password input details
- **Action**: Click into password field
- **Expected**:
  - Placeholder: "Enter your password"
  - Input type is `password` (text is masked with dots)
  - Same styling and focus ring as email field

### 1.08 — Create account link
- **Action**: Click "Create account" link
- **Expected**: Navigates to `/register` page

### 1.09 — Button disabled state
- **Action**: Fill valid email+password, click Sign in, observe button during API call
- **Expected**: Button shows "Signing in...", becomes disabled (opacity-60, cursor not-allowed) during submission

---

## Section 2: Registration Page (`/register`)

### 2.01 — Page load
- **Action**: Navigate to `/register`
- **Expected**:
  - Heading: **"Create account"** — text-2xl, bold, centered
  - Fields (top to bottom):
    1. First name + Last name (side by side, 2-column grid)
    2. Email (full width)
    3. Password (full width)
    4. Phone number (full width, labeled "optional")
    5. Data consent fieldset with 3 checkboxes
  - Blue **"Create account"** button full-width
  - "Already have an account? **Sign in**" link at bottom

### 2.02 — First name / Last name fields
- **Action**: Inspect the name fields
- **Expected**:
  - Two equal-width fields side by side
  - Labels: "First name" and "Last name"
  - Both required (browser validation on submit)
  - Min-height 44px each

### 2.03 — Phone field optional label
- **Action**: Look at phone field label
- **Expected**: Label reads "Phone number" with "(optional)" in lighter gray text (font-normal, text-gray-400)

### 2.04 — Data consent checkboxes
- **Action**: Inspect the three checkboxes
- **Expected**:
  - Fieldset legend: "Data consent"
  - **Checkbox 1**: "I consent to my data being used for educational purposes." — has red asterisk (required)
  - **Checkbox 2**: "I consent to anonymized, aggregate analytics." — no asterisk (optional)
  - **Checkbox 3**: "I consent to full profile data processing." — no asterisk (optional)
  - Checkboxes are 20x20px (h-5 w-5), rounded, blue-600 when checked

### 2.05 — Submit without required consent
- **Action**: Fill all fields but leave first checkbox unchecked, click Create account
- **Expected**: Form won't submit; browser validation or app error indicating education consent is required

### 2.06 — Password validation
- **Action**: Enter password "short" (less than 8 chars, no number), attempt submit
- **Expected**: Validation error — password requires minimum 8 characters and at least one number

### 2.07 — Successful registration
- **Action**: Fill all required fields correctly with a new email, check education consent, click Create account
- **Expected**:
  - Button text changes to "Creating account..." while submitting
  - On success, redirects to `/onboarding` (new user persona flow)

### 2.08 — Duplicate email registration
- **Action**: Try registering with `demo@sabificate.com` (already exists)
- **Expected**: Red error banner appears with "Email already registered" or similar

### 2.09 — Sign in link
- **Action**: Click "Sign in" link at bottom
- **Expected**: Navigates to `/login`

---

## Section 3: Onboarding (`/onboarding`)

> Requires authenticated user who hasn't completed persona selection.

### 3.01 — Screen 1: Persona selection
- **Action**: Log in as new user (or one without persona), navigate to `/onboarding`
- **Expected**:
  - Header: "SABIficate" in blue-700
  - 3 progress dots at top (first filled blue-600, rest gray-200)
  - Heading: **"Which sounds like you?"**
  - Subheading: "This helps us tailor your learning path..."
  - 4 persona cards, each with:
    - Colored border and background:
      - New Graduate: emerald (green)
      - Mid-Career Professional: blue
      - Team Lead/Manager: purple
      - Senior Specialist: amber
    - Icon (SVG), title, and description text
  - Cards are full-width, tappable buttons

### 3.02 — Persona card selection
- **Action**: Tap one persona card (e.g., "Mid-Career Professional")
- **Expected**:
  - Selected card gets thicker border in its persona color
  - Advances to Screen 2 (calibration question)
  - Progress dots update: 2 of 3 filled

### 3.03 — Screen 2: Calibration question
- **Action**: Observe calibration screen after persona selection
- **Expected**:
  - **"Back"** button at top-left with left-arrow icon (blue text)
  - Heading: **"Quick check"**
  - Question text displayed in font-medium
  - Multiple choice options as radio buttons:
    - Each option: rounded-lg border-2, full width
    - Unselected: border-gray-200, white background
    - Selected: border-blue-600, bg-blue-50, blue radio indicator filled
  - **"Continue"** button below options — disabled (opacity-40) until an option is selected

### 3.04 — Select calibration answer
- **Action**: Tap one answer option, then tap Continue
- **Expected**:
  - Selected option shows blue border + filled radio indicator
  - Continue button becomes active (full opacity, blue-700 background)
  - Advances to Screen 3 (learning path result)
  - Progress dots: 3 of 3 filled

### 3.05 — Screen 3: Learning path result
- **Action**: Observe the result screen
- **Expected**:
  - Heading: **"Your learning path"**
  - Subheading: "Based on your answers..."
  - Tier display card: rounded-xl, border-blue-200, centered content
    - Circular blue icon
    - Tier title (e.g., "Working Knowledge") in lg font-bold
    - Tier description in text-sm
  - **"Change my level"** link — gray underlined text
  - Submit button: full-width, blue-700 background

### 3.06 — Change level override
- **Action**: Click "Change my level"
- **Expected**:
  - 3 tier override buttons appear: Foundational, Working, Applied
  - Each: full-width, rounded-lg, border-2
  - Current recommended tier is pre-selected (blue border)
  - Can select a different tier
  - "Change my level" link disappears

### 3.07 — Submit onboarding
- **Action**: Click the submit button on Screen 3
- **Expected**:
  - Button shows loading state (disabled, opacity-60)
  - Redirects to Dashboard (`/`) on completion
  - Dashboard now shows learner content (not the onboarding redirect)

### 3.08 — Back button functionality
- **Action**: On Screen 2, click "Back"
- **Expected**: Returns to Screen 1 (persona selection) with progress dots updated

---

## Section 4: Dashboard (`/`)

### 4.01 — Authenticated dashboard
- **Action**: Log in as `demo@sabificate.com`, land on `/`
- **Expected**:
  - Greeting: **"Welcome back, Demo"** (or user's first name) — text-xl, bold
  - Subtitle: "Continue your learning journey" — text-sm, gray-500
  - 4 stat cards in 2x2 grid:
    - **Lessons Done**: blue-50 background, blue-700 number
    - **Courses Completed**: green-50 background, green-700 number
    - **Learning Time**: purple-50 background, purple-700 number with "h" suffix
    - **Day Streak**: orange-50 background, orange-700 number
  - "My Courses" section heading
  - Enrolled course cards (or empty state)

### 4.02 — Enrolled courses display
- **Action**: Observe "My Courses" section (if user has enrollments)
- **Expected** (per course card):
  - Course title (font-medium, gray-900)
  - Lesson progress count: "N/M" in text-xs gray-500 (right-aligned)
  - Progress bar: gray-100 track with blue-600 fill
  - Percentage text: "X% complete" below bar
  - Entire card is tappable — links to `/courses/:slug`

### 4.03 — Empty enrolled courses
- **Action**: Log in as user with no enrollments
- **Expected**:
  - Dashed border container with text "No courses enrolled yet"
  - **"Browse Courses →"** link in blue-700

### 4.04 — Recent activity
- **Action**: Observe below "My Courses" (if activity exists)
- **Expected**:
  - Heading: **"Recent Activity"**
  - Up to 5 items, each with green checkmark "✓" and activity title
  - Items in a vertical list with gap-3

### 4.05 — Unauthenticated dashboard
- **Action**: Navigate to `/` while logged out
- **Expected**:
  - Heading: **"Welcome to SABIficate"**
  - Subtitle: "Professional microlearning for Nigerian working professionals"
  - Two buttons centered (max-w-xs):
    - **"Sign In"** — blue-700 bg, white text, full-width
    - **"Create Account"** — white bg, gray border, gray-700 text, full-width
  - **"Browse Courses →"** link below in blue-700

### 4.06 — Onboarding redirect
- **Action**: Log in as user who hasn't completed persona selection
- **Expected**: Automatically redirected to `/onboarding` (never sees dashboard)

---

## Section 5: Course Catalog (`/courses`)

### 5.01 — Page load
- **Action**: Navigate to `/courses`
- **Expected**:
  - Heading: **"Course Catalog"** — text-2xl, bold
  - Search input: full-width, placeholder "Search courses...", rounded-lg border
  - Two filter dropdowns side by side:
    - **Category**: "All Categories (N)" + individual categories with counts
    - **Difficulty**: "All Levels (N)", "Foundational (N)", "Working (N)", "Applied (N)"
  - Course count text: "N courses" in text-sm font-medium gray-600
  - Course cards in responsive grid: 1-col mobile, 2-col tablet, 3-col desktop

### 5.02 — Course card anatomy
- **Action**: Inspect any course card
- **Expected**:
  - Thumbnail image (h-40) or gradient fallback (blue-to-indigo with first letter)
  - Title: text-base, font-semibold, max 2 lines (line-clamp-2)
  - Category pill: rounded-full, bg-gray-100, text-gray-700, text-xs
  - Difficulty badge with color coding:
    - **Foundational**: bg-green-100, text-green-800
    - **Working**: bg-yellow-100, text-yellow-800
    - **Applied**: bg-red-100, text-red-800
  - Meta row: clock icon + duration, book icon + "N lessons"
  - Card has shadow-sm, border gray-200, hover:shadow-md
  - Entire card is clickable (links to course detail)

### 5.03 — Search functionality
- **Action**: Type "compliance" in search input
- **Expected**:
  - Course list filters in real-time or on debounce
  - Only courses matching "compliance" in title/description shown
  - Course count updates to match filtered results
  - Search uses `query` parameter (verify in network tab: `/api/v1/courses?query=compliance`)

### 5.04 — Category filter
- **Action**: Select a specific category from dropdown
- **Expected**:
  - Grid updates to show only courses in that category
  - Course count updates
  - Category dropdown shows selected value

### 5.05 — Difficulty filter
- **Action**: Select "Foundational" from difficulty dropdown
- **Expected**:
  - Only courses with "Foundational" difficulty shown
  - All visible course cards show green "Foundational" badge
  - Course count updates

### 5.06 — Combined filters
- **Action**: Set a category filter AND a difficulty filter AND type a search term
- **Expected**: All three filters apply simultaneously; course count reflects intersection

### 5.07 — Empty search results
- **Action**: Search for "xyznonexistent999"
- **Expected**:
  - No course cards shown
  - Empty state: gray SVG icon (h-16 w-16) + text "No courses found..."
  - Course count shows "0 courses"

### 5.08 — Pagination
- **Action**: If more than ~12 courses, scroll to bottom
- **Expected**:
  - Pagination bar: Previous button | "Page N of M" | Next button
  - Previous disabled on page 1 (opacity-40)
  - Next disabled on last page (opacity-40)
  - Clicking Next loads next page of courses

### 5.09 — Loading skeleton
- **Action**: Reload page and observe before data loads
- **Expected**: 6 skeleton cards with animated pulse: gray rectangle for image, gray bars for text/badges

### 5.10 — Course card click
- **Action**: Click any course card
- **Expected**: Navigates to `/courses/:slug` (course detail page)

---

## Section 6: Course Detail (`/courses/:slug`)

### 6.01 — Page load
- **Action**: Click a course from the catalog
- **Expected**:
  - Course title displayed prominently
  - Course metadata: difficulty badge, category, CPD hours, duration, lesson count
  - Course description/overview text
  - Module and lesson structure displayed
  - "Enroll" button or "Continue Learning" if already enrolled

### 6.02 — Enroll in course
- **Action**: Click "Enroll" button (if not already enrolled)
- **Expected**:
  - Button shows loading state during API call
  - On success, button changes to "Continue Learning" or "Start Learning"
  - Course appears in Dashboard "My Courses" section

### 6.03 — Lesson list display
- **Action**: Observe the lesson/module breakdown
- **Expected**:
  - Modules listed with their lessons underneath
  - Each lesson shows title
  - Lessons link to the lesson player (`/courses/:slug/lessons/:lessonId`)

### 6.04 — Back to catalog
- **Action**: Look for navigation back to course list
- **Expected**: Back button/link or breadcrumb leading to `/courses`

---

## Section 7: Lesson Player (`/courses/:slug/lessons/:lessonId`)

> Requires enrollment. Use `demo@sabificate.com` and enroll in a course first.

### 7.01 — Top bar layout
- **Action**: Open any lesson
- **Expected**:
  - Sticky top bar with:
    - Progress bar at very top: thin (h-1) bar, gray track with blue fill showing progress percentage
    - Lesson title: text-sm, font-semibold, truncated if long
    - Card counter: "N of M" with optional duration "~X min"
    - **Difficulty selector dropdown**: Select with options "Foundational", "Working", "Applied"

### 7.02 — Difficulty selector
- **Action**: Change the difficulty dropdown from e.g. "Working" to "Foundational"
- **Expected**:
  - Content reloads to show Foundational-level material
  - Content blocks change (simpler language, different depth)
  - Dropdown retains selected value

### 7.03 — Text content block
- **Action**: Navigate to a card with text content
- **Expected**:
  - Rich HTML rendering: headings, bold, italic, links, lists
  - Links open in new tab (`target="_blank"`)
  - Proper typography with leading-relaxed
  - Images (if any) are max-width, rounded, lazy-loaded

### 7.04 — Quiz block
- **Action**: Navigate to a card with a quiz
- **Expected**:
  - **Bloom level badge** at top: colored pill (blue=remember, green=understand, yellow=apply, orange=analyze, red=evaluate, purple=create)
  - Question text in font-medium
  - Multiple choice options as buttons:
    - Each with circular letter badge (A, B, C, D...)
    - Full-width, min-h-44px, rounded-lg
    - Hover: border turns blue
  - Options are clickable (not yet answered)

### 7.05 — Quiz answer correct
- **Action**: Select the correct answer on a quiz
- **Expected**:
  - Correct option: green border (border-green-500), bg-green-50
  - All other options disabled with reduced opacity
  - Feedback panel appears below: bg-green-50, border-green-200
  - Bold text **"Correct!"** followed by explanation

### 7.06 — Quiz answer incorrect
- **Action**: Select a wrong answer on a quiz
- **Expected**:
  - Selected wrong option: red border (border-red-500), bg-red-50
  - Correct option also highlighted in green
  - Feedback panel: bg-red-50, border-red-200
  - Bold text **"Incorrect"** followed by explanation
  - All options disabled after answering

### 7.07 — Scenario block
- **Action**: Navigate to a card with a scenario/decision tree
- **Expected**:
  - Scenario description box: bg code-background, rounded-lg
  - "Scenario" label at top of box
  - Context tags: company type, regulatory body (colored pills)
  - Cultural context aside (if present): left-border accent, smaller text, labeled "Cultural Context"
  - Decision question text
  - Choice buttons: full-width, rounded-lg, border

### 7.08 — Scenario decision progression
- **Action**: Select a choice in the scenario
- **Expected**:
  - Choice registers, feedback appears
  - Decision history builds up showing previous choices:
    - "Decision N" label in accent color
    - Selected choice label
    - Feedback text
  - Next decision node appears (or completion message)

### 7.09 — Scenario completion
- **Action**: Complete all decisions in a scenario
- **Expected**: Green completion banner: bg-green-50, border-green-200, centered text "Scenario Complete" or similar

### 7.10 — Artifact prompt block
- **Action**: Navigate to a card with an artifact prompt
- **Expected**:
  - 3 context badges: target role, industry vertical, career level (accent-colored pills)
  - Prompt box: code-background, rounded-lg
    - "Artifact Prompt" label
    - Prompt text
  - Rubric checklist: checkboxes with rubric items
  - Textarea: 6 rows, placeholder "Write your artifact response here..."
  - **"Submit Artifact"** button: full-width, blue, min-h-44px

### 7.11 — Artifact submission
- **Action**: Write text in textarea, check some rubric items, click Submit Artifact
- **Expected**:
  - Button changes to "Submitted" with disabled state
  - Success message appears: green text, centered
  - Textarea becomes disabled (opacity-50)
  - Rubric checkboxes remain in their checked/unchecked state

### 7.12 — Bottom navigation dots
- **Action**: Observe bottom of lesson player (if lesson has ≤15 cards)
- **Expected**:
  - Row of dots centered horizontally:
    - Current card: wider dot (w-4), blue accent color
    - Viewed cards: normal dot (w-2), blue with opacity-40
    - Unviewed cards: normal dot (w-2), gray border color
  - Dots are clickable — tapping jumps to that card

### 7.13 — Next/Previous buttons
- **Action**: Observe navigation buttons at bottom
- **Expected**:
  - Two buttons side by side (flex-1 each):
    - **Previous**: border button, disabled on first card (opacity-30)
    - **Next**: blue accent button
  - On last card: button changes to **"Next Lesson"** (if next lesson exists) or **"Complete"** (green-600)

### 7.14 — Swipe navigation
- **Action**: On mobile/touch, swipe left on content area
- **Expected**: Advances to next card (same as clicking Next)

### 7.15 — Swipe right
- **Action**: Swipe right on content area
- **Expected**: Goes to previous card (same as clicking Previous)

### 7.16 — Complete lesson
- **Action**: Navigate to last card, click "Complete" or "Next Lesson"
- **Expected**:
  - If "Next Lesson": navigates to next lesson in the module
  - If "Complete": lesson marked as complete, returns to course detail or dashboard
  - Progress updates on dashboard

### 7.17 — Empty content fallback
- **Action**: Select a difficulty tier that has no content for this lesson
- **Expected**: Centered message: "No content available for the [tier] level..." in gray text

---

## Section 8: Curriculum Studio (`/studio`)

> Requires admin login: `admin@firstbank-training.ng` / `admin1234`

### 8.01 — Page load (list view)
- **Action**: Navigate to `/studio`
- **Expected**:
  - Heading: **"Curriculum Studio"** — text-xl, bold
  - Subtitle: "7-stage authoring pipeline..." — text-sm, gray-600
  - **"Concept Catalog"** link — blue-600 text
  - **"New Track"** button — blue-600 bg, white text, rounded-md
  - List of existing tracks (or empty state)

### 8.02 — Empty track list
- **Action**: Observe if no tracks exist
- **Expected**:
  - "No authoring tracks yet" — text-lg, gray-500
  - "Create your first track..." — text-sm

### 8.03 — Track card
- **Action**: Observe a track in the list
- **Expected** (per track card):
  - Track name: text-sm, font-semibold, gray-900
  - Status badge: rounded-full pill (e.g., bg-blue-100 text-blue-700)
  - Vertical text: text-xs, gray-500
  - Customer tier: text-xs, gray-400
  - Updated date: text-xs, gray-400
  - **Delete button** (only on draft/intake status): red text "Delete", text-xs
  - Card is clickable — opens editor view

### 8.04 — Create new track
- **Action**: Click "New Track" button
- **Expected**: Opens editor view with Stage 1: Track Setup form

### 8.05 — Stage tracker
- **Action**: In editor view, observe the stage tracker at top
- **Expected**:
  - Horizontal scrollable row of 7 stage buttons:
    1. Track Setup
    2. Skill Intake
    3. AI Decomposition
    4. Pre-filled Brief
    5. AI Course Generation
    6. Assembly Review
    7. Publish
  - Completed stages: bg-green-100, text-green-800, "Done" label
  - Current stage: bg-blue-100, text-blue-800, "Current" label, ring-2 ring-blue-500
  - Future stages: bg-gray-100, text-gray-500

### 8.06 — Stage 1: Track Setup form
- **Action**: View Stage 1 form
- **Expected**:
  - Title: "Stage 1: Track Setup"
  - Fields:
    - **Track Name** input: placeholder "e.g. AML Compliance..."
    - **Vertical** dropdown: options "Financial Literacy", "Banking Compliance", "Insurance", "Fintech", "Professional Development"
    - **Customer Tier** dropdown: options "Freemium", "Hiring", "Upskilling", "Premium"
    - **Tier Treatment** dropdown: options "A - Standard", "B - Enhanced", "C - Premium"
    - **Credential Type** dropdown: options "Completion Badge", "Verified Certificate", "Team Record", "Professional Certificate"
    - **Paywall** number input: min 0, max 20, helper text "Lessons before this index are free"
  - Customer Tier + Tier Treatment on same row (2-column grid)
  - Credential Type + Paywall on same row (2-column grid)
  - Submit button: "Create Track" (new) or "Update Setup" (existing), blue-600

### 8.07 — Stage 2: Skill Intake form
- **Action**: Complete Stage 1, advance to Stage 2
- **Expected**:
  - Title: "Stage 2: Skill Intake"
  - Fields:
    - **Skill Statement** textarea: 4 rows, placeholder describes competency
    - **Target Learner Role** input: placeholder "e.g. Branch Operations Officer..."
    - **Context Mode** radio buttons:
      - "Nigerian Context" (radio)
      - "Generic / International" (radio)
      - Helper text about Nigerian regulations
  - Submit button: "Submit Skill Intake", blue-600

### 8.08 — Stage 3: AI Decomposition
- **Action**: Advance to Stage 3
- **Expected**:
  - Title: "Stage 3: AI Decomposition"
  - Yellow info banner: "Click the button below..."
  - **"Run AI Decomposition"** button: yellow-600 bg, white text
  - After running:
    - Metadata block: model used, nodes generated, catalog matches
    - Spine nodes listed, each with:
      - Index badge (blue circle)
      - Title + objective
      - Bloom level badge (purple pill)
      - Catalog overlap badge
      - Concept ID badge (if matched)
      - **"Approve"** button (green when approved)
      - **"Remove"** button (red-100, red-700)

### 8.09 — Stage 4: Pre-filled Brief
- **Action**: Advance to Stage 4
- **Expected**:
  - Title: "Stage 4: Pre-filled Brief"
  - **Things to Avoid** textarea: placeholder "e.g. Avoid jargon..."
  - **Gateway Personas** section:
    - Header with **"+ Add Persona"** button (blue-100)
    - At least 1 persona container with:
      - Label input: placeholder "Label (e.g. New Employee)"
      - Default proficiency dropdown: "Foundational", "Working", "Applied"
      - Description textarea
      - Remove button (if >1 persona, red text)
  - Submit: "Save Brief" button, blue-600

### 8.10 — Stage 5: AI Course Generation
- **Action**: Advance to Stage 5
- **Expected**:
  - Title: "Stage 5: AI Course Generation"
  - Yellow banner + **"Generate Course Content"** button
  - After generation:
    - Green success banner: "Generation Complete"
    - Metadata grid: model, total blocks, trust claims flagged, languages
    - Content summary per spine node:
      - 3-column depth cards: Foundational (green), Working (blue), Applied (purple)
      - Block counts per tier
      - Trust claims flag (amber) if present

### 8.11 — Stage 6: Assembly Review
- **Action**: Advance to Stage 6
- **Expected**:
  - Title: "Stage 6: Assembly Review"
  - **"Start Assembly Review"** button (yellow-600)
  - After starting:
    - Status info in blue box
    - 4 review checkboxes:
      1. Terminology Consistency
      2. Difficulty Progression
      3. Artifact Quality
      4. Coverage Completeness
    - Each with title + description
    - **Reviewer Notes** textarea
    - Submit button:
      - All checked: green-600, label "Approve and Complete Review"
      - Not all checked: amber-600, label "Request Changes"

### 8.12 — Stage 7: Publish
- **Action**: Advance to Stage 7 (after review approval)
- **Expected**:
  - Title: "Stage 7: Publish"
  - Blue info banner listing what publish creates:
    - New course record
    - One module per spine node
    - Lessons with 3-tier content
    - Persona and calibration records
    - Credential template
  - **"Publish"** button: green-600
  - After publishing: green success banner with course ID and date
  - **"Unpublish"** button appears: red-600

### 8.13 — Back button
- **Action**: Click "← " back arrow in editor view
- **Expected**: Returns to track list view

### 8.14 — Delete track
- **Action**: In list view, click Delete on a draft track
- **Expected**: Track removed from list (confirmation may appear)

### 8.15 — Error states
- **Action**: Observe if API errors occur during any stage
- **Expected**:
  - Red error banner: bg-red-50, border-red-200, text-red-700
  - Dismissible with "dismiss" underline link

---

## Section 9: Concept Catalog (`/catalog`)

> Requires admin login

### 9.01 — Page load
- **Action**: Navigate to `/catalog`
- **Expected**:
  - Heading: **"Concept Catalog"** — text-xl, bold
  - Subtitle: "Reusable competency concepts with stable IDs for cross-track linking"
  - **"+ Add Concept"** button: blue-600, white text
  - Search input: placeholder "Search by name or domain..."
  - Domain filter dropdown: "All" + dynamic domains from data
  - **"Search"** button: gray-100 bg, border
  - Concept cards in 2-column grid (sm:grid-cols-2)

### 9.02 — Concept card
- **Action**: Inspect any concept card
- **Expected**:
  - Name: text-sm, font-semibold, truncated
  - Concept ID: monospace, text-xs, gray-500 (e.g., "aml-fundamentals-001")
  - Domain badge: rounded-full, bg-blue-100, text-blue-700, text-xs
  - Spine position (if set): "Spine position: N"
  - Prerequisites (if any): gray pills with monospace text

### 9.03 — Add concept form toggle
- **Action**: Click "+ Add Concept" button
- **Expected**:
  - Button text changes to "Cancel"
  - Form appears above search: bg-gray-50 border, rounded-lg
  - Fields:
    - Concept ID (slug) — required, placeholder "e.g. aml-fundamentals-001"
    - Name — required
    - Domain — required
    - Spine Position — optional, number input
    - Prerequisites — optional, comma-separated
  - **"Create Concept"** button: blue-600, disabled when required fields empty

### 9.04 — Create concept
- **Action**: Fill required fields (Concept ID, Name, Domain), click Create Concept
- **Expected**:
  - Button shows "Creating..."
  - Form resets and hides on success
  - New concept appears in the grid
  - Concept has the entered name, ID, and domain badge

### 9.05 — Search concepts
- **Action**: Type in search input, press Enter or click Search
- **Expected**: Cards filter to show matching concepts by name or domain

### 9.06 — Domain filter
- **Action**: Select a specific domain from dropdown
- **Expected**: Only concepts in that domain shown, search re-triggers

### 9.07 — Empty state
- **Action**: Search for nonexistent term
- **Expected**: "No concepts found" + "Add your first concept or adjust your search."

### 9.08 — Error with dismiss
- **Action**: Trigger an API error (e.g., duplicate concept_id)
- **Expected**: Red error banner with "dismiss" link to clear it

---

## Section 10: Credentials (`/credentials`)

> Requires authenticated learner who has completed courses

### 10.01 — Page load with credentials
- **Action**: Navigate to `/credentials` (logged in as learner with completions)
- **Expected**:
  - Grid of credential cards: 1-col mobile, 2-col on sm+
  - Each card:
    - Credential tier badge at top:
      - Completion Badge: bg-green-50, text-green-700
      - Verified Certificate: bg-blue-50, text-blue-700
      - Team Record: bg-purple-50, text-purple-700
      - Professional Certificate: bg-amber-50, text-amber-700
    - Course title: font-semibold, line-clamp-2
    - Certificate number: monospace, gray-500
    - Issue date: formatted (e.g., "21 June 2026")
    - Status badge:
      - Active: bg-green-100, text-green-800
      - Expired: bg-gray-100, text-gray-600
      - Revoked: bg-red-100, text-red-800
  - NO download button anywhere on this page

### 10.02 — Empty credentials
- **Action**: Log in as user with no completions, go to `/credentials`
- **Expected**:
  - Gray circle icon with diploma SVG
  - "No credentials yet" — font-medium
  - "Complete a course to earn..." — gray-500

### 10.03 — Credential detail view
- **Action**: Click a credential card
- **Expected**:
  - **"Back to credentials"** link at top (blue, with left-arrow icon)
  - Credential card with:
    - Blue gradient header: course title (white, bold), certificate number (blue-100 monospace)
    - Co-brand logo in header (if applicable)
    - **QR Code section**: centered, 200px QR code on gray-50 background
    - Details:
      - Status badge (active/expired/revoked)
      - Issued date (formatted with Nigerian locale)
      - Expiry date (if set)
      - Signatory (if co-branded)
      - Evidence/artifact links (if any)
    - **Share button**: full-width, blue-600, text "Share verification link"
    - NO download button — VERIFY THIS IS ABSENT

### 10.04 — Share button
- **Action**: Click "Share verification link"
- **Expected**:
  - Copies verification URL to clipboard
  - Button text changes to **"Link copied!"** for 2 seconds
  - Then reverts to "Share verification link"

### 10.05 — Upgrade button (conditional)
- **Action**: Look for upgrade button on completion badge cards
- **Expected**: If user has a completion badge but no verified certificate for same course, "Upgrade" button appears: blue-600, text-xs, full-width

### 10.06 — Back button
- **Action**: Click "Back to credentials" from detail view
- **Expected**: Returns to credential list

---

## Section 11: Public Verify Page (`/verify/:credentialId`)

> This page is accessible without login

### 11.01 — Valid credential verification
- **Action**: Navigate to `/verify/<valid-credential-uuid>` (get UUID from credential detail share link)
- **Expected**:
  - SABIficate branded header: blue gradient, "S" logo, "Credential Verification" subtitle
  - Green validity banner:
    - Green shield/check icon (h-8 w-8)
    - **"Valid Credential"** — text-lg, bold
    - "This credential has been verified by SABIficate"
  - Credential details:
    - **Awarded To**: learner name
    - **Course**: course title
    - **Certificate Number**: monospace
    - **Issued**: formatted date (Nigerian locale)
    - Co-brand info (if applicable): logo + signatory name
    - Evidence links (if any)
  - Footer: "Verified by SABIficate — sabificate.com"

### 11.02 — Invalid credential ID
- **Action**: Navigate to `/verify/00000000-0000-0000-0000-000000000000` (nonexistent)
- **Expected**:
  - Same SABIficate header
  - **Red** validity banner:
    - Red X-circle icon
    - **"Invalid Credential"** — text-lg, bold
    - "This credential could not be verified"
  - No credential details shown (section is hidden when credential is null)
  - Footer still present

### 11.03 — Malformed credential ID
- **Action**: Navigate to `/verify/not-a-uuid`
- **Expected**: Either red error state or red "Invalid Credential" banner — no crash, no white screen

### 11.04 — Loading state
- **Action**: Navigate to verify URL on slow connection / observe before data loads
- **Expected**:
  - Centered spinner: blue circle with transparent top (animate-spin)
  - Text: "Verifying credential..."
  - Gray-50 background, full viewport height

---

## Section 12: Admin Dashboard (`/admin`)

> Requires admin login: `admin@firstbank-training.ng` / `admin1234`

### 12.01 — Page load
- **Action**: Log in as admin, navigate to `/admin`
- **Expected**:
  - Heading: **"Admin Dashboard"** — text-2xl, bold
  - **"Upload CSV"** button: blue-600 bg, white text
  - 4 metric cards in grid (2-col mobile, 4-col desktop):
    - **Total Learners**: number, uppercase label
    - **Active (30d)**: number
    - **Completion Rate**: number with % suffix
    - **Avg Score**: number with % suffix
  - NO "Export Report" button — VERIFY THIS IS ABSENT

### 12.02 — Compliance status widget
- **Action**: Observe compliance section
- **Expected**:
  - Heading: **"Compliance Status"**
  - Requirement cards in 2-column grid:
    - Course title (font-semibold)
    - Regulatory body + deadline (text-xs, gray-500)
    - Department rows with:
      - Status dot: red (Overdue), yellow (At Risk), green (Compliant)
      - Department name (truncated)
      - Compliance fraction: "N/M"
      - Percentage (right-aligned)

### 12.03 — Top performers widget
- **Action**: Observe top performers table
- **Expected**:
  - Heading: **"Top Performers"**
  - Table with columns: #, Name, Department (hidden mobile), Completed, Avg Score
  - Header: bg-gray-50, uppercase text-xs labels
  - Rows: hover:bg-gray-50, numeric columns right-aligned

### 12.04 — Learner search
- **Action**: Type in the search input below widgets
- **Expected**:
  - Placeholder: "Search learners by name, email, or department..."
  - Table filters as you type

### 12.05 — Learners table
- **Action**: Observe the main learners table
- **Expected**:
  - Columns (responsive):
    - Name (always visible)
    - Email (hidden on small)
    - Department (hidden on medium)
    - Courses enrolled
    - Completed (hidden on small)
    - Avg Score (hidden on medium)
    - Hours (hidden on large)
    - Last Active (hidden on large)
  - Data rows with hover:bg-gray-50

### 12.06 — Learner table pagination
- **Action**: If many learners, check bottom of table
- **Expected**:
  - Previous/Next buttons with page indicator
  - Previous disabled on page 1
  - Next disabled on last page

### 12.07 — CSV Upload modal
- **Action**: Click "Upload CSV" button
- **Expected**:
  - Modal overlay: black/40 opacity background
  - Modal dialog: max-w-lg, white, rounded-lg, shadow-xl
  - Header: "Upload Learners CSV" + X close button
  - Drop zone:
    - Dashed border (border-2)
    - Upload arrow icon
    - Text: "Drag and drop your CSV file here, or **click to browse**"

### 12.08 — CSV file selection
- **Action**: Click the drop zone to browse files
- **Expected**: File picker opens, filtered to CSV files

### 12.09 — CSV drag and drop
- **Action**: Drag a file over the drop zone
- **Expected**: Border turns blue-500, background turns blue-50 (active drop state)

### 12.10 — CSV file selected state
- **Action**: Select a CSV file
- **Expected**:
  - File info bar: file icon + filename (truncated) + file size in KB
  - bg-gray-50, rounded-lg
  - **"Upload"** button becomes active: blue-600

### 12.11 — CSV upload progress
- **Action**: Click Upload with a valid CSV
- **Expected**:
  - Uploading state: spinner + "Uploading file..."
  - Polling state: progress bar with:
    - "N / M rows" counter
    - "X%" percentage
    - Blue progress bar fill animating

### 12.12 — CSV upload complete
- **Action**: Wait for upload to finish
- **Expected**:
  - Green success banner: checkmark + "Upload complete"
  - Stats grid (3 columns):
    - Total (gray-50)
    - Succeeded (green-50, green-700 number)
    - Failed (red-50, red-700 number)
  - Error table (if any failures): Row #, Email, Error message
  - **"Close"** button: full-width, gray border

### 12.13 — Modal close
- **Action**: Click X button or Close button
- **Expected**: Modal closes, returns to admin dashboard, learner table may refresh

### 12.14 — Non-admin access
- **Action**: Log in as `demo@sabificate.com` (learner role), navigate to `/admin`
- **Expected**: Access denied / 403 error / redirect — admin content NOT visible to learners

---

## Section 13: Pricing Page (`/pricing`)

### 13.01 — Page load
- **Action**: Navigate to `/pricing`
- **Expected**:
  - Heading: **"Choose Your Plan"** — text-3xl, bold, centered
  - Subtitle: "Invest in your professional development..." — text-lg, gray-600, centered
  - Individual plans in 3-column grid (stacks to 1-col on mobile)
  - B2B section below with divider

### 13.02 — Individual plan cards
- **Action**: Inspect the plan cards
- **Expected** (3 plans, one highlighted):
  - Highlighted plan: border-blue-600, ring-2, shadow-lg, has **"Most Popular"** badge (blue pill)
  - Standard plans: border-gray-200, shadow-sm
  - Each card contains:
    - Plan name: text-xl, bold
    - Currency symbol (small) + Price (text-4xl, bold) + period text
    - Savings badge (if applicable): green-600 text
    - Features list with green checkmarks (h-5, w-5)
    - CTA button at bottom

### 13.03 — Plan CTA buttons
- **Action**: Inspect the call-to-action buttons
- **Expected**:
  - Active plans: Link styled as button
    - Highlighted: blue-600 bg, white text
    - Standard: gray-900 bg, white text
  - Disabled/current plan: gray-100 bg, gray-400 text, cursor-not-allowed
  - Buttons are full-width within card

### 13.04 — B2B section
- **Action**: Scroll to "For Organizations" section
- **Expected**:
  - Divider line (border-t) above
  - Heading: **"For Organizations"** — text-2xl, bold
  - Subtitle about team compliance training
  - 3 B2B plan cards with:
    - Plan name
    - Price per seat per month
  - **"Contact Sales"** button: gray-900 bg, white text, centered

### 13.05 — Nigerian currency
- **Action**: Check pricing display
- **Expected**: Prices shown with Nigerian Naira (₦) or relevant currency marker

---

## Section 14: Profile Page (`/profile`)

### 14.01 — Authenticated view
- **Action**: Navigate to `/profile` while logged in
- **Expected**:
  - Avatar circle: h-16, w-16, bg-blue-100, user's initials (first letter of first + last name) in blue-700 bold
  - Full name: text-lg, bold
  - Email: text-sm, gray-500
  - Role badge: rounded-full, bg-blue-100, text-blue-700, capitalize (e.g., "Learner" or "Corporate_admin")

### 14.02 — Data usage mode selector
- **Action**: Observe data usage section
- **Expected**:
  - Section heading: "Data Usage Mode"
  - 3 mode options as buttons:
    - Each: rounded-lg, border, full-width, text-left
    - Selected: border-blue-600, bg-blue-50, shows "Active" label in blue
    - Unselected: border-gray-200
    - Each has label + description text

### 14.03 — Change data mode
- **Action**: Click a different data usage mode
- **Expected**:
  - Selected mode updates immediately (blue border + "Active" indicator)
  - Previously selected mode reverts to gray
  - Content rendering changes in lesson player to match mode

### 14.04 — Account section
- **Action**: Observe account details
- **Expected**:
  - Section heading: "Account"
  - Language row: "Language" label, "English" value — bordered row
  - Organization row (conditional): "Organization" label, "Linked" value — only shown if user has org_id

### 14.05 — Sign out
- **Action**: Click the sign-out button at bottom
- **Expected**:
  - Button: full-width, red-50 bg, border-red-200, "Sign Out" text in red-700
  - Clicking logs out and redirects to `/login` or unauthenticated dashboard

### 14.06 — Unauthenticated view
- **Action**: Navigate to `/profile` while logged out
- **Expected**:
  - Text: "Sign in to view your profile"
  - **"Sign In"** link: blue-700, font-medium

---

## Section 15: Navigation & Layout

### 15.01 — Top bar
- **Action**: Observe the top bar on any authenticated page
- **Expected**:
  - Sticky at top, h-14 (56px), white bg, border-b gray-200
  - Left: **"SABIficate"** logo text (text-lg, bold), **"Studio"** link (blue-600, text-xs)
  - Right: DataSaverBadge + SyncStatus + optional offline indicator

### 15.02 — DataSaver badge
- **Action**: Check the badge in top-right area
- **Expected** (one of):
  - "Full" — bg-green-100, text-green-800
  - "Data Saver" — bg-amber-100, text-amber-800
  - "Ultra Light" — bg-red-100, text-red-800

### 15.03 — Bottom navigation
- **Action**: Observe bottom nav bar on mobile
- **Expected**:
  - Fixed at bottom, white bg, border-t gray-200
  - 4 tabs with emoji icons:
    - ⌂ Home → `/`
    - 📖 Courses → `/courses`
    - 🎓 Credentials → `/credentials`
    - 👤 Profile → `/profile`
  - Active tab: blue-700, font-semibold
  - Inactive tabs: gray-500
  - Each tab: min-44px touch target

### 15.04 — Active tab highlighting
- **Action**: Navigate between pages using bottom nav
- **Expected**: Active tab updates to blue, previously active reverts to gray

### 15.05 — Studio link in top bar
- **Action**: Click "Studio" link in top bar
- **Expected**: Navigates to `/studio` (Curriculum Studio)

### 15.06 — Offline indicator
- **Action**: Simulate offline mode (DevTools > Network > Offline)
- **Expected**: Red dot (h-2.5, w-2.5, rounded-full, bg-red-500) appears in top bar

---

## Section 16: White Paper Page

### 16.01 — Page access
- **Action**: Navigate to the white paper page (check if accessible from nav or direct URL)
- **Expected**: Static content page renders without errors, educational/informational content about SABIficate

---

## Section 17: Edge Cases & Security

### 17.01 — No download buttons
- **Action**: Check EVERY page for any download/export functionality
- **Expected**: 
  - **ZERO** download buttons on any page
  - No "Export", "Download PDF", "Download CSV", "Download Certificate" buttons
  - Credential detail has ONLY "Share verification link" button
  - Admin dashboard has ONLY "Upload CSV" button (upload, NOT download)

### 17.02 — No agent protocols visible
- **Action**: Search all visible text on every page for AI/agent terminology
- **Expected**: No mention of "agent protocols", AI internals, model names, or prompt engineering details in any user-facing UI

### 17.03 — Rate limiting
- **Action**: Rapidly click login button 20+ times with wrong credentials
- **Expected**: Eventually get 429 Too Many Requests response (rate limiter active)

### 17.04 — Invalid route
- **Action**: Navigate to `/nonexistent-page`
- **Expected**: Either shows 404 page, redirects to home, or shows blank within AppShell (not a white crash screen)

### 17.05 — Unauthenticated API access
- **Action**: While logged out, navigate directly to `/admin`, `/studio`, `/catalog`, `/credentials`
- **Expected**:
  - `/admin`: Should not show admin data; either redirects or shows empty/error
  - `/studio`: Same — no studio data for unauthenticated users
  - `/catalog`: Same — concept catalog requires auth
  - `/credentials`: Should show empty state or redirect to login

### 17.06 — Learner accessing admin routes
- **Action**: Log in as `demo@sabificate.com`, manually navigate to `/admin`
- **Expected**: Admin data NOT visible; should see error, empty state, or access denied

### 17.07 — Learner accessing studio
- **Action**: Log in as `demo@sabificate.com`, manually navigate to `/studio`
- **Expected**: Studio data NOT visible; API returns 403

### 17.08 — XSS in search
- **Action**: Type `<script>alert('xss')</script>` in course catalog search
- **Expected**: Text displayed literally or escaped — no alert popup, no script execution

### 17.09 — XSS in registration
- **Action**: Try registering with name `<img src=x onerror=alert(1)>`
- **Expected**: Name stored and displayed as text — no script execution on dashboard

### 17.10 — JWT token expiry
- **Action**: Log in, wait for token to expire (or manually delete from localStorage), then try accessing a protected page
- **Expected**: Redirected to login page, not a white error screen

### 17.11 — Concurrent sessions
- **Action**: Log in as same user in two browser tabs
- **Expected**: Both tabs function independently; actions in one tab don't crash the other

### 17.12 — Back button navigation
- **Action**: Use browser back button after navigating through several pages
- **Expected**: Previous page loads correctly, no stale state or crashes

### 17.13 — Refresh on protected page
- **Action**: Log in, navigate to `/credentials`, press F5 to reload
- **Expected**: Page reloads correctly with data (token persists in localStorage)

### 17.14 — API error handling
- **Action**: Open DevTools, block API requests via network tab, then navigate to a data-loading page
- **Expected**: Error states display properly (red banners, retry options, or friendly messages) — no white screens or unhandled promise rejections

### 17.15 — Mobile viewport
- **Action**: Open DevTools, toggle device toolbar, select iPhone 12 or similar
- **Expected**:
  - All pages responsive — no horizontal scrollbar
  - Bottom nav visible and functional
  - Touch targets ≥ 44px
  - Cards stack to single column
  - Tables scroll horizontally on admin page

---

## Section 18: PWA Behavior

### 18.01 — Install prompt
- **Action**: Open site in Chrome mobile, check for PWA install banner
- **Expected**: Browser offers "Add to home screen" or install option

### 18.02 — Offline capability
- **Action**: After loading the app, go offline and refresh
- **Expected**: Service worker serves cached shell — app doesn't show browser error page

---

## Test Execution Summary

| Section | Tests | Description |
|---------|-------|-------------|
| 1. Login | 9 | Auth flow, validation, error states |
| 2. Register | 9 | Form fields, validation, consent checkboxes |
| 3. Onboarding | 8 | 3-screen persona flow, tier selection |
| 4. Dashboard | 6 | Auth/unauth states, stats, courses |
| 5. Course Catalog | 10 | Search, filters, cards, pagination |
| 6. Course Detail | 4 | Enrollment, lesson list |
| 7. Lesson Player | 17 | All content types, navigation, difficulty |
| 8. Curriculum Studio | 15 | 7-stage pipeline, all forms |
| 9. Concept Catalog | 8 | CRUD, search, filter |
| 10. Credentials | 6 | List, detail, share, QR |
| 11. Public Verify | 4 | Valid/invalid verification |
| 12. Admin Dashboard | 14 | Metrics, tables, CSV upload modal |
| 13. Pricing | 5 | Plans, B2B, CTA buttons |
| 14. Profile | 6 | User info, data mode, sign out |
| 15. Navigation | 6 | Top bar, bottom nav, routing |
| 16. White Paper | 1 | Static page render |
| 17. Edge/Security | 15 | XSS, auth gates, rate limits, mobile |
| 18. PWA | 2 | Install, offline |
| **TOTAL** | **135** | |
