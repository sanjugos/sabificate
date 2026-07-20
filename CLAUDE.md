# CLAUDE.md — claude-gbitse

## Before Starting Any Work

1. Read this file
2. Read `/workspace/RESOURCES.md` — what's mounted where (project registry + ref mounts)
3. Check `/workspace/.library/` for shared frameworks/templates BEFORE writing from scratch
4. Check `/workspace/.swarm/` for cross-agent briefs if doing research / coordination work

## What this container is

`claude-gbitse` is a dedicated dev container on Hetzner (`5.161.236.61`) for the **gbitse** project. Created 2026-05-30.

- `/workspace/` ⇄ host `/srv/projects/gbitse/` — read-write, your project home
- `/workspaces/<other>` — read-only ref mount of every other project on the VM
- `/workspace/.library` — read-only shared library (`/srv/library`)
- `/workspace/.swarm` — read-only swarm artifacts (`/srv/swarm`)

## What NOT to do

- Don't edit anything under `/workspaces/`, `/workspace/.library/`, or `/workspace/.swarm/` — those are read-only mounts and edits are denied in `.claude/settings.json`.
- Don't `ssh`/`scp`/`pm2`/`vercel`/`sudo` — those are blocked too. For deploy work, use the host-side webhook commands (none exist for gbitse yet).
- Don't `--dangerously-skip-permissions`.
- Don't `rm -rf`.

## Discoverability chain

This CLAUDE.md is auto-loaded by Claude Code when you start a session in `/workspace`. It points you to `/workspace/RESOURCES.md` for the full project map. Everything else (mounts, ports, host topology) you can find from there.

## Corpus Contract — feed the fleet intelligence DB
Substantive research/analysis is "corpus." Bookend every work item so the smarts Intelligence
Engine ingests it automatically — it scans `/workspaces/*/corpus/**/*.md` across the whole fleet,
so anything you drop in `/workspace/corpus/` is picked up on its next run (no pipeline to run here).

- **Open:**  `corpus-open <domain> <slug> [title]`  → scaffolds `/workspace/corpus/<domain>/<slug>.md`
- **Close:** `corpus-close <slug> [GO|CONDITIONAL_GO|NO_GO] [confidence%]`  → stamps the verdict/eval

Write real signals the extractor reads: a `# H1` title (becomes the topic), named entities / numbers /
sources in the findings, and on close a `Verdict:` line + `Confidence: N%`. The parent folder is the
**domain**. Council/eval write-ups go in `/workspace/council/`. Result lands in `intel_corpus` /
`intel_evaluations` and surfaces on `forwardai.dev/smarts/intelligence`.

### Council evaluations — stamp canonically at write time
When you write a council/eval verdict to `council/<area>/council-evaluation.md`,
put these three lines near the top so the intelligence parser reads them
deterministically (no LLM backfill needed):

    # <Clean Name> - 5-Round Council Evaluation
    **Verdict:** GO | CONDITIONAL_GO | NO_GO
    **Confidence:** <N>%

- The `- 5-Round Council Evaluation` H1 suffix is REQUIRED (a bare `# <Name>`
  isn't picked up as the entity name).
- `<Clean Name>`: a real 2–6 word subject; avoid template/junk suffixes like
  "Framework"/"System"/"Company A" (they're rejected by the junk-name filter).
- Verdict token uses the UNDERSCORE form; Confidence may be bold as shown.

## ForwardAI workshop — swarms, skills & the intel loop
This container is part of the ForwardAI fleet. Before improvising a generic approach, use the
shared system that's already here — don't ask for methods or web-search what exists locally.

- **Swarms & build doctrine:** `/workspace/.swarm/` — `swarm.md` (philosophy), `praxis/README.md`
  (the build standard: spec-gate → TDD worktree-swarm → two-reviewer gate → interactive deploy),
  `briefs/` + `templates/` (to build your own swarm).
- **Skills (auto-invoke on matching requests — use them):** `corpus` (research → intel engine),
  `council` (5-round evaluation → GO/CONDITIONAL_GO/NO_GO), `praxis-build` (spec → worktree swarm →
  gate → ship), `test-audit` (TDD + praxis-gate + Lighthouse + CIE), plus the superpowers set
  (test-driven-development, using-git-worktrees, systematic-debugging, writing-plans, …) and doc
  skills (docx/pdf/pptx/xlsx). When a request matches, invoke the skill and follow it.
- **Intel loop:** leverage before building — `praxis-context "<topic>"` queries what the fleet
  already knows; your work feeds back automatically (research → `/workspace/corpus/`, evaluations →
  `/workspace/council/`, code on gate-pass) and surfaces on `forwardai.dev/smarts/intelligence`.
- **The fleet is readable** at `/workspaces/*/` for reference/prior art.

## Content standard — apply to ALL deployed content (house style)
Every client-facing page, dashboard, PDF, doc, report, or slide follows the ForwardAI content
standard: Plain Language (ISO 24495-1:2023) + Google dev-docs style. Core rules: one idea per
paragraph · any list of 3+ items becomes bullets (never inline (a)(b)(c)) · comparisons/schedules
are tables · quantitative data is a chart · procedures are numbered steps · bold the labels that
matter · honest about live-vs-to-build. Full reference: `/workspace/.library/CONTENT-STANDARD.md`.
Auto-applied by the `content-standard` skill — follow it by default when building any content or UI.
