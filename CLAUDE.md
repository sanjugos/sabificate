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
