#!/bin/bash
# Ensure SABIficate backend is running — call from cron or startup
if ! curl -s -o /dev/null -w '' http://localhost:3001/api/v1/health 2>/dev/null; then
  echo "$(date): Server not running, starting..."
  cd /workspace/app
  nohup bash /workspace/app/start-production.sh >> /tmp/sabificate-server.log 2>&1 &
  echo "$(date): Started PID $!"
fi
