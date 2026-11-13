#!/usr/bin/env sh
uvicorn main:app --host 0.0.0.0 --port "${API_PORT:-8000}" --reload
