# Deploying sabificate.forwardai.dev (from claude-gbitse)

Static site served by nginx from /srv/projects/gbitse/sabificate/dist (= /workspace/sabificate/dist).

## Put your site in /workspace/sabificate/
- **Vite/React app:** put the project there (with package.json). Deploy runs
  `npm ci && npm run build` -> dist/. (Same toolchain as your gbitse.forwardai.dev site.)
- **Plain static:** drop index.html + assets directly in /workspace/sabificate/; deploy
  copies them into dist/.

## Publish
```bash
TOK=$(cat /workspace/.deploy/sabificate-token)
curl -fsS -X POST http://172.17.0.1:3625/deploy/full -H "Authorization: Bearer $TOK"
```
Live at https://sabificate.forwardai.dev (once DNS is added — see below).

| Command | Effect |
|---|---|
| POST /deploy/full  | build (if package.json) or copy static -> dist; nginx serves it |
| GET  /healthz      | liveness |

## Notes
- This is the **sabificate-token** (`/workspace/.deploy/sabificate-token`), SEPARATE from
  your gbitse.forwardai.dev token (`/workspace/.deploy/token`, webhook :3604).
- DNS: sabificate.forwardai.dev needs a Cloudflare A record -> 5.161.236.61 (proxied),
  same as gbitse. Ask Sanju if not done yet.
- Pure static only; for a backend API ask Sanju for a socat+nginx api route.
