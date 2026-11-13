#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"
PORT="${AI_ENGINE_PORT:-8001}"
HOST="${AI_ENGINE_HOST:-0.0.0.0}"

echo "Starting UrbanFlow AI Engine (AGENT_3) on http://${HOST}:${PORT}..."
exec python3 -m uvicorn main:app --host "${HOST}" --port "${PORT}"
