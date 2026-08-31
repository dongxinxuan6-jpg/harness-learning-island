#!/usr/bin/env bash
set -euo pipefail

node_major="$(node -p "process.versions.node.split('.')[0]")"
if [ "$node_major" -lt 22 ]; then
  echo "Node.js 22 or newer is required. Current version: $(node --version)" >&2
  exit 1
fi

npm ci

if [ ! -f .env ] && [ -f .env.example ]; then
  cp .env.example .env
  echo "Created .env from .env.example. Add provider credentials only when running the pipeline."
fi

npm run build
echo 'Jingjian is ready. Run: npm run dev'
