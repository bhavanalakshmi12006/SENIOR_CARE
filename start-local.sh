#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
(cd backend && test -f .env || cp .env.example .env)
(cd frontend && test -f .env || cp .env.example .env)
printf '\nMongoDB must be running separately and reachable through backend/.env\n'
printf 'Terminal 1: cd backend && npm install && npm run seed && npm start\n'
printf 'Terminal 2: cd frontend && npm install && npm run dev\n'
