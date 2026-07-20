# SABIficate — Project Constitution

- **Project:** SABIficate
- **Constitution version:** 2.0.0
- **Ratified:** 2026-07-20
- **Owner:** ForwardAI (sanju)

---

## I. NON-NEGOTIABLE PRINCIPLES

These are hard gates. A change that violates any of them cannot be merged or
deployed, regardless of test status or reviewer preference. The
`spec-compliance-reviewer` and `code-quality-security-reviewer` subagents
treat a violation here as an automatic BLOCK.

1. **No external API calls from the running product** — except named §III exceptions.
   Build-time/dev-time tooling may reach the network; the *product* may not
   unless covered by an exception below.

2. **Secrets never leave the host.**
   Credentials live in on-host env (`.env`) and are read at runtime only.
   No secret is committed to git, baked into an image, echoed into logs, sent
   to an external service, or pasted into a chat/PR. `.env*` is git-ignored.

3. **Interactive-only deploys.**
   Every deploy is human-invoked through the on-host webhook path
   (`curl -X POST http://172.17.0.1:3625/deploy/full`), executed from an
   INTERACTIVE Claude Code session. No headless `claude -p`, no CI/CD, no
   scheduled/Routine deploy.

---

## II. ENGINEERING PRINCIPLES

4. **Spec-gate before code.**
   No implementation task starts until `spec.md`, `plan.md`, and `tasks.md`
   exist and have passed their operator gates.

5. **TDD Iron Law.**
   For every behavioural change: write a FAILING test first, watch it fail for
   the right reason, then write the minimum code to make it pass, then refactor.
   No production code is authored ahead of a red test.

6. **Fresh subagent per task.**
   Each task is executed by a fresh, context-isolated subagent in its own git
   worktree (`isolation: worktree`). `[parallel]` tasks run concurrently.

7. **Two-reviewer merge gate.**
   A worktree's diff merges only after BOTH `spec-compliance-reviewer` and
   `code-quality-security-reviewer` return PASS. Either FAIL blocks.

8. **Idempotent, reversible operations.**
   Every script is idempotent, uses `set -euo pipefail`, supports `--dry-run`,
   and documents an explicit rollback path.

9. **Ground truth over generation.**
   Decisions reference the real on-host registries and this constitution.

---

## II-B. SECURITY & COMPLIANCE CONTROLS (v2.0.0)

10. **Secure coding by default.** Input validated, output encoded, parameterized
    DB access, no `eval`/`shell=True`/unsafe deserialize.
    [ASVS V5 · SSDF PW.5 · 25010-Security]

11. **Authorize server-side, least privilege.** Every non-public route enforces
    auth + authZ on the server; roles are least-privilege.
    [ASVS V4 · SOC2 CC6.1–6.3]

12. **Encrypt in transit and at rest.** TLS on all transport; passwords hashed
    with bcrypt; no deprecated crypto.
    [ASVS V6/V9 · SOC2 CC6.7]

13. **Isolate tenant data; minimize PII.** Data isolated per org; only necessary
    PII collected; NDPA-compliant consent; no PII in logs.
    [SOC2 CC6 · NDPA 2023]

14. **Audit the security-relevant.** Auth, authZ, and data-change events logged;
    logs contain no secrets/PII.
    [SOC2 CC7 · ISO 27001 A.12]

15. **Own the supply chain.** Dependencies pinned; SBOM produced; no critical CVE.
    [SSDF PS/PW.4 · SLSA]

16. **Fail securely, leak nothing.** Errors never expose secrets or stack traces;
    security headers set; debug off in production.
    [ASVS V7/V14]

17. **Accessible by default.** User-facing surfaces meet WCAG 2.2 AA.
    [WCAG 2.2]

18. **Govern AI use.** PII sent to external models only under §III exception;
    provenance recorded; human-in-loop on consequential decisions.
    [ISO/IEC 42001]

---

## III. NAMED EXCEPTIONS

### Exception 1: Anthropic Claude API (Studio AI Pipeline)

- **What:** The Curriculum Studio backend calls the Anthropic Claude API at
  runtime for skill decomposition, course generation, trust claim extraction,
  and brief generation.
- **Scope:** Server-side only (`server/services/curriculumAI.ts`). Never called
  from the client/browser. API key stored in `.env` (`ANTHROPIC_API_KEY`).
- **PII controls:** No learner PII is sent to Claude. Inputs are skill
  statements, learning objectives, and content briefs (non-personal curriculum
  data). Model + prompt hash + token count logged per generation_job.
- **Fallback:** When `ANTHROPIC_API_KEY` is not set, the service returns mock
  data (mock mode). No production dependency on API availability for learner
  experience.
- **Rationale:** AI content generation is the core value proposition. Building
  an on-host LLM of equivalent capability is not feasible. The Studio pipeline
  is not learner-facing; it is a production tool used by curriculum authors.

### Exception 2: Paystack Payment API

- **What:** The Learner App backend calls the Paystack API at runtime for
  subscription creation, payment verification, and webhook processing.
- **Scope:** Server-side only (`server/routes/payments.ts`,
  `server/services/paymentService.ts`). API keys in `.env`
  (`PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY`).
- **PII controls:** Paystack receives email and payment amount only (minimum
  required by payment processor). No course content or learning data sent.
- **Rationale:** Paystack is the dominant Nigerian payment processor. On-host
  payment processing is not legally or practically feasible.

### Exception 3: WhatsApp Business API (Deferred — v1.1)

- **What:** Server-side WhatsApp message sending for lesson delivery.
- **Scope:** `server/whatsapp/*`. Not active in v1.
- **PII controls:** Phone number + lesson content only. No learning analytics.
- **Rationale:** WhatsApp is the primary communication channel in Nigeria.
  Required for the low-bandwidth B2C delivery model.

---

## IV. AMENDMENT PROCEDURE

1. Propose the change as a diff to this file.
2. Bump `Constitution version`.
3. Both review subagents must run against the amendment.
4. Owner approves interactively.

---

## V. COMPLIANCE CHECK

A change is COMPLIANT only if all are true:

- [ ] No new runtime external-API call (or covered by a §III exception).
- [ ] No secret added to git / image / log / PR; `.env*` still ignored.
- [ ] No headless/CI deploy path introduced; deploy remains webhook+interactive.
- [ ] Every changed behaviour traces to a task in `tasks.md` and a line in `spec.md`.
- [ ] A failing-test-first commit exists for each behavioural change.
- [ ] Inputs validated + output encoded; DB parameterized; no eval (P10).
- [ ] Every non-public route enforces server-side authZ (P11).
- [ ] TLS in transit; bcrypt for passwords; no deprecated crypto (P12).
- [ ] Tenant data isolated; NDPA consent; no PII in logs (P13).
- [ ] Security events audit-logged (P14).
- [ ] Deps pinned; SBOM produced; no critical CVE (P15).
- [ ] Errors leak nothing; security headers; no prod debug (P16).
- [ ] WCAG 2.2 AA (P17).
- [ ] No PII to external models w/o §III exception; provenance recorded (P18).
