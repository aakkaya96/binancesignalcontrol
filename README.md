# Crypto Signal App

Repo hazırlanmıştır: frontend (Vite + React) ve backend (Express + TypeScript).

Local geliştirme
- Backend:
  cd backend
  npm install
  npm run dev
- Frontend:
  cd frontend
  npm install
  npm run dev

Prod build & start (Render / production)
- Backend (node):
  cd backend
  npm ci
  npm run build
  npm start
  - Expose PORT via environment variable (Render provides PORT automatically).

- Frontend (static):
  cd frontend
  npm ci
  npm run build
  - Serve `frontend/dist` (Render static site or any static host).

Render deployment notes
- Create Backend: Web Service
  - Build command: `cd backend && npm ci && npm run build`
  - Start command: `cd backend && npm start`
  - Set environment variable PORT if needed (Render provides it).
- Create Frontend: Static Site
  - Build command: `cd frontend && npm ci && npm run build`
  - Publish directory: `frontend/dist`

Commit & push:
  git add .
  git commit -m "Prepare repo for GitHub/Render: backend build/start, tsconfig, gitignore, README"
  git push origin main
