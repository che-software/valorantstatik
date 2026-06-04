# Valorant Tracker — Monorepo

A full-stack Valorant stats tracker built with **Next.js** (frontend) and **Express + Mongoose** (REST API).

```
valorantstatik/
├── apps/
│   ├── web/   ← Next.js 16  (Vercel)
│   └── api/   ← Express 4 + Mongoose  (Railway / Render)
├── .gitignore
├── package.json
└── README.md
```

## Quick Start

### 1. Clone
```bash
git clone https://github.com/YOUR_USERNAME/valorant-tracker.git
cd valorant-tracker
```

### 2. Environment variables

**Frontend** (`apps/web/.env.local`):
```env
HENRIK_API_KEY=HDEV-xxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=mongodb+srv://...
```

**Backend** (`apps/api/.env`):
```env
PORT=4000
MONGODB_URI=mongodb+srv://...
HENRIK_API_KEY=HDEV-xxx
ALLOWED_ORIGINS=http://localhost:3000
```

### 3. Install & Run

```bash
# Install both projects
cd apps/web && npm install
cd ../api  && npm install

# Run frontend (terminal 1)
cd apps/web && npm run dev        # http://localhost:3000

# Run backend (terminal 2)
cd apps/api && npm run dev        # http://localhost:4000
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Liveness check |
| GET | `/health/ready` | Readiness check (MongoDB) |
| GET | `/api/v1/players/:name/:tag` | Player profile + rank |
| GET | `/api/v1/players/:name/:tag/matches` | Match history |
| GET | `/api/v1/players/:name/:tag/stats` | Lifetime stats |
| GET | `/api/v1/players/:name/:tag/full` | All-in-one |
| GET | `/api/v1/leaderboard/:region` | Top 50 players |

## Deploy

- **Frontend** → [Vercel](https://vercel.com) — connect `apps/web`
- **Backend** → [Railway](https://railway.app) or [Render](https://render.com) — connect `apps/api`

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS |
| Backend | Express 4, Mongoose 8, Node 18+ |
| Database | MongoDB Atlas (Free tier) |
| API Source | HenrikDev Valorant API |
