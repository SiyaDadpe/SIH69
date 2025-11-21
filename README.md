# SIH69 — Life Cycle Assessment (LCA) Platform

Full‑stack platform for metal lifecycle analytics with a guided 7‑step Wizard, drag‑and‑drop Canvas builder, dashboards, analytics, and rich reports. The repo contains a React (Vite) client and an Express/MongoDB server.

## Highlights

- 7‑stage LCA workflow: Mining → Beneficiation → Refining → Smelting → Manufacturing → Recycling → Valorization
- Two ways to work:
	- Wizard: structured forms with validation, progress, and submit flow
	- Canvas: operation library + drag/drop workflow + one‑click LCA calc
- Reports: generated from Wizard/Canvas (PDF/JSON export, searchable)
- Secure API with auth, validation, rate‑limit, and sanitization
- Ready dev scripts, seeders, and Postman‑friendly APIs

## Monorepo structure

```
SIH69/
├─ client/                # React + Vite app (Tailwind, shadcn/ui, XYFlow)
│  ├─ src/
│  │  ├─ pages/           # Dashboard, Projects, Wizard, Reports, Canvas, Analytics
│  │  ├─ sections/        # Complex sections; includes Wizard forms
│  │  ├─ services/        # Axios API client and feature services
│  │  └─ layouts/         # MainLayout with sidebar
│  └─ vite.config.js
└─ server/                # Express API + MongoDB
	 ├─ src/
	 │  ├─ controllers/     # auth, canvas, wizard, reports, etc.
	 │  ├─ routes/          # route modules (/api/*)
	 │  ├─ middleware/      # security, validation, upload
	 │  ├─ models/          # Mongoose models
	 │  ├─ config/          # env validation, DB connect
	 │  ├─ app.js           # express app (middleware + routes)
	 │  └─ index.js         # server entry
	 ├─ scripts/            # seeders, test utilities
	 └─ COMPLETE_API_DOCUMENTATION.md
```

## Tech stack

- Frontend: React 19, Vite, React Router, Tailwind v4, shadcn/ui (Radix), XYFlow, Recharts, Leaflet, Framer Motion, React Hook Form + Zod
- Backend: Node/Express, Mongoose, Helmet, CORS, Rate‑limit, Multer, PDFKit
- DB: MongoDB (local or Atlas)

## Prerequisites

- Node.js 18+ (16+ may work; backend engines specify >=16)
- MongoDB (local or cloud)

## Environment variables

Create .env files from the provided examples:

- `server/.env` (copy from `server/.env.example`)
	- PORT=5000
	- NODE_ENV=development
	- CORS_ORIGIN=http://localhost:5173
	- MONGO_URI=mongodb://localhost:27017/sih69
	- JWT_SECRET=your‑secret
	- JWT_EXPIRES_IN=7d
	- BCRYPT_SALT_ROUNDS=10
	- (optional) REDIS_URL, API_VERSION, LOG_LEVEL

- `client/.env` (copy from `client/.env.example`)
	- VITE_API_URL=http://localhost:5000/api

## How to run (development)

Open two terminals:

1) Backend

```powershell
cd server
npm install
npm run dev
```

Expected: Server logs with port (default 5000) and DB connection.

2) Frontend

```powershell
cd client
npm install
npm run dev
```

Open: http://localhost:5173

## Seeding data (recommended)

From `server/`:

- Seed operations library:

```powershell
node scripts/seedOperations.js
```

- Seed demo database (projects, reports, etc.) if available:

```powershell
node scripts/seedDatabase.js
```

More utilities in `server/scripts/`:
- checkLatestWizard.js, checkProjects.js, checkWizards.js, getUserIds.js, listProjects.js
- testCanvasReportIntegration.js, testWizardReportIntegration.js, testReportsAPI.js, testPdfExport.js, testRecyclingStep.js

## API documentation

- Full reference: `server/COMPLETE_API_DOCUMENTATION.md`
- Base URL (dev): `http://localhost:5000/api`
- Key domains:
	- Canvas: operations, workflows, calculate, generate‑report
	- Wizard: multi‑step workflows, step update/complete, submit, generate‑report
	- Reports: query/search, export PDF/JSON, update/delete

Swagger is scaffolded in `server/src/app.js` (commented). You can enable it later.

## Frontend overview

- Routing (`client/src/App.jsx`):
	- Public: `/` (Landing), `/login`, `/signup`
	- Auth UI with sidebar (via `MainLayout`): `/dashboard`, `/projects`, `/wizard`, `/reports`, `/canvas`, `/analytics`
- API client (`client/src/services/api.js`): Axios with `VITE_API_URL`, bearer token from localStorage
- Wizard UI: Accessible via `/wizard` with Zod‑validated forms and animated CTAs
- Canvas: Drag/drop workflow builder (uses `/api/canvas/*`)

## Production build

Frontend:

```powershell
cd client
npm run build
npm run preview  # optional local preview
```

Backend:

```powershell
cd server
npm install --production
npm start
```

Ensure `client/.env` points `VITE_API_URL` to your deployed API.

## Testing

Backend unit/integration tests:

```powershell
cd server
npm test
```

End‑to‑end API exercises (manual scripts):

```powershell
node scripts/testCanvasReportIntegration.js
node scripts/testWizardReportIntegration.js
node scripts/testReportsAPI.js
node scripts/testPdfExport.js
```

## Troubleshooting

- Server exits on startup with "Missing required environment variables":
	- Create `server/.env` from example and fill all required keys (see above)
- CORS blocked in browser:
	- Ensure `CORS_ORIGIN` includes your frontend origin (e.g., http://localhost:5173)
- MongoDB connection failed:
	- Check `MONGO_URI` and that MongoDB is running / Atlas IP is whitelisted
- Unauthorized responses:
	- Ensure you store `accessToken` in localStorage after login; Axios attaches it
- Reports can’t be created manually:
	- This is by design—use Canvas/Wizard generate‑report endpoints


## Architecture (client ⇄ API ⇄ MongoDB)
- Path: `docs/images/architecture.png`

## License

MIT. See `LICENSE`.

---

Maintainers: SIH69 Team — Last updated: November 2025

//this is for test purpose only 