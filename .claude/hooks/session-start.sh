#!/bin/bash
set -euo pipefail

# Only run in remote (web) sessions
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# Pull latest code so CLAUDE.md and other recent changes are always present
git pull origin main --ff-only --quiet || true

# Install frontend dependencies
npm install

# Install api dependencies
cd api && npm install 2>/dev/null || true
