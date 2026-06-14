#!/usr/bin/env bash
set -euo pipefail

# Build and deploy SABIficate frontend to sabificate.forwardai.dev
cd /workspace/app
echo "Building..."
npx vite build

echo "Copying to deploy directory..."
cp -r dist/* /workspace/sabificate/

echo "Deploying..."
curl -fsS -X POST http://172.17.0.1:3625/deploy/full \
  -H "Authorization: Bearer $(cat /workspace/.deploy/sabificate-token)"

echo ""
echo "Live at https://sabificate.forwardai.dev/"
