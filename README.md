# ApnaStay Monorepo Starter

This repository now includes:
- backend (FastAPI + Firebase Auth verification + Firestore-ready repositories)
- frontend (Vite + React + Tailwind + React Query + Firebase client)
- mobile (React Native + Expo starter)

## Project structure
- backend/
- frontend/
- mobile/
- docker-compose.yml

## Quick start
1. One command (Docker)
   - Run: `./start.ps1`
   - This creates missing `.env` files from examples and starts backend + frontend via Docker Compose.

1. Backend
   - Go to backend/
   - Copy .env.example to .env
   - Install dependencies: pip install -r requirements.txt
   - Run: uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

2. Frontend
   - Go to frontend/
   - Copy .env.example to .env
   - Install dependencies: npm install
   - Run: npm run dev

3. Mobile (Expo)
   - Go to mobile/
   - Copy .env.example to .env
   - Install dependencies: npm install
   - Run: npm run start

4. One command (Local terminals, no Docker)
   - Run: `./start-local.ps1`
   - This opens backend and frontend in separate PowerShell windows.

## Notes
- Frontend expects backend base URL at http://localhost:8000/api/v1
- Backend now includes owner CRUD and admin moderation endpoints wired for Firestore when project config is set.
- Current scaffold includes sample fallback data for public search when Firestore project config is not set.

## Implemented API highlights
- Public/student/owner/admin core: `/api/v1/properties/search`, `/api/v1/properties/{property_id}`, `/api/v1/owner/properties`, `/api/v1/admin/listings/pending`
- Reviews: `POST /api/v1/properties/{property_id}/reviews`, `GET /api/v1/properties/{property_id}/reviews`
- Shortlists: `POST /api/v1/properties/{property_id}/shortlist`, `DELETE /api/v1/properties/{property_id}/shortlist`, `GET /api/v1/me/shortlists`
- Recent views: `POST /api/v1/properties/{property_id}/view`, `GET /api/v1/me/recent-views`
- Inquiries: `POST /api/v1/properties/{property_id}/inquiries`
- Alerts: `POST /api/v1/me/alerts`, `GET /api/v1/me/alerts`, `PATCH /api/v1/me/alerts/{alert_id}`, `DELETE /api/v1/me/alerts/{alert_id}`
- Admin reporting and audit: `GET /api/v1/admin/analytics/overview`, `GET /api/v1/admin/logs`

## Dev auth and smoke tests
- Dev token users are defined in [backend/data/dev_users.json](backend/data/dev_users.json)
- Generate dev JWTs:
   - `e:/pgliving/.venv/Scripts/python.exe backend/scripts/generate_dev_tokens.py`
- Run authenticated end-to-end smoke tests (owner + admin + student):
   - `powershell -ExecutionPolicy Bypass -File backend/scripts/smoke_auth.ps1`

## Firestore setup assets
- Indexes file: [backend/firestore.indexes.json](backend/firestore.indexes.json)
- Rules baseline: [backend/firestore.rules](backend/firestore.rules)
- Seed script (colleges/users/properties):
   - `e:/pgliving/.venv/Scripts/python.exe backend/scripts/seed_firestore.py`

## Frontend role modules
- Owner dashboard with token input, create listing form, and availability controls:
   - [frontend/src/pages/OwnerDashboardPage.tsx](frontend/src/pages/OwnerDashboardPage.tsx)
- Admin dashboard with token input, moderation actions, analytics, and logs:
   - [frontend/src/pages/AdminDashboardPage.tsx](frontend/src/pages/AdminDashboardPage.tsx)
