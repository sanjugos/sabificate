# RESOURCES.md — claude-gbitse workspace map

Auto-discoverable map of every project + shared resource visible from this container. **Updated 2026-05-30 when the container was created.**

## Your own workspace — READ/WRITE

| Path inside container | Host path | Notes |
|---|---|---|
| `/workspace/` | `/srv/projects/gbitse/` | Your project home. Code, notes, experiments. Persists across container restarts. |

## All other projects — READ-ONLY

`/workspaces/<project>/` mirrors every sibling project on the VM. Useful for studying patterns, copying snippets out into `/workspace/`, or tracing cross-project context. Cannot be edited (read-only mount + settings.json deny).

| Subdir | What lives there |
|---|---|
| `/workspaces/athena/` | Multi-tenant Next.js platform (Probe + admin) |
| `/workspaces/caputility/` | Credit-union climate finance + LL97 lead-gen (Stackline) |
| `/workspaces/bots/` | Sentinel trading, Kalshi, IB gateway |
| `/workspaces/refiner/` | Argus + counter-narrative platform + forwardai-site staging |
| `/workspaces/argus/` | Argus production codebase + Echo (rargus) |
| `/workspaces/echo/` | Echo (rargus.forwardai.dev) live deploy root |
| `/workspaces/tradecircle/`, `/workspaces/tradecircle-packages/` | Contractor / vertical SaaS platform |
| `/workspaces/forwardai/` | forwardai.dev marketing + dashboards (apex static) |
| `/workspaces/forwardai-capital/` | ForwardAI Capital fund work |
| `/workspaces/coryphaeus/` | CRM platform + screenshots inbox (see below) |
| `/workspaces/mindfulmedia/` | Mindful Media platform |
| `/workspaces/films/` | Films platform |
| `/workspaces/njordpolaris/` | Njord Polaris bots-marketplace strategy |
| `/workspaces/bcdc/` | BCDC |
| `/workspaces/cbn/` | CBN |
| `/workspaces/alphanova/` | AlphaNova platform |
| `/workspaces/handyman/` | Handyman vertical |
| `/workspaces/nativegardens/` | NativeGardens vertical |
| `/workspaces/prediction-markets/` | Polymarket / prediction-markets research |
| `/workspaces/arbitrage/` | Arbitrage strategies |
| `/workspaces/stock-trading/` | Stock-trading research |
| `/workspaces/maytrix/` | Maytrix |
| `/workspaces/french/` | French / language |
| `/workspaces/fitness/` | Fitness platform |
| `/workspaces/abide/` | PJ / Abide Custom Builders (construction estimator) |
| `/workspaces/petermeng/` | PREPARIFIED work |
| `/workspaces/sajan/` | Sajan personal/admin |

## Shared library — READ-ONLY

| Path | Host path | Notes |
|---|---|---|
| `/workspace/.library/` | `/srv/library/` | Documentation, papers, reusable specs, design memos, frameworks, templates. **Always check here BEFORE writing new code.** |

## Shared swarm dir — READ-ONLY

| Path | Host path | Notes |
|---|---|---|
| `/workspace/.swarm/` | `/srv/swarm/` | Multi-agent swarm artifacts, prompts, traces from cross-project research. |

## Files dropped from Sanju's Mac

`~/vm-screenshots/` on Mac is auto-rsync'd to Hetzner at `/srv/projects/coryphaeus/screenshots/`. Visible from this container (read-only) at:

```
/workspaces/coryphaeus/screenshots/
```

When the user says "I just saved a screenshot" or "I dropped a file," look there.

## Where deployed apps live (Hetzner host)

This is context for "where does X actually serve from." You can't deploy directly from this container, but reading these can help you understand the live picture.

| Surface | Hetzner port | PM2 / systemd name | Source dir on host |
|---|---|---|---|
| `forwardai.dev` (apex) | nginx static | — | `/srv/projects/forwardai/` |
| `admin.forwardai.dev` | 3501 | `forwardai-admin.service` | `/srv/projects/forwardai/forwardai-admin/` |
| `argus.forwardai.dev` | 3002 + 3004 | `argus.service` + `argus2.service` | `/srv/projects/argus/` |
| `genesis.forwardai.dev` | 3506 | PM2 `genesis-hetz` | `/srv/projects/genesis/` |
| `refiner.forwardai.dev` | 3505 | PM2 `refiner-hetz` | `/srv/projects/refiner/` |
| `rargus.forwardai.dev` (Echo) | 3507 | PM2 `echo-hetz` | `/srv/projects/echo/` |
| `ll97.caputility.com` | docker compose | `infra-web-1` + `infra-api-1` + `infra-db-1` + `infra-ingest-1` + `infra-reports-worker-1` + `infra-scheduler-1` | `/srv/projects/caputility/ll97-leadgen/` |

## What's NOT available

- No direct SSH out from this container (`Bash(ssh *)` is denied).
- No Lightsail SSH keys here (those live on the host at `/opt/refiner-deploy/`).
- No prod database credentials.
- No Postgres access (Postgres is exposed only inside the `infra_default` compose network).

## How to start exploring

```bash
# Read the workspace
cd /workspace
ls -la

# Discover any other project's structure
ls /workspaces/refiner/src

# Look at shared specs
ls /workspace/.library

# Check what's currently in the screenshots/file inbox
ls /workspaces/coryphaeus/screenshots/
```
