# Development Setup

## 1. Prerequisites

- Node.js 18+ and npm
- MongoDB running locally or a connection string
- Git
- (Optional) Docker + Docker Compose for local MongoDB

## 2. Clone the repository

```bash
git clone <repo-url>
cd RetroHub
```

## 3. Install dependencies

Install root tooling and each service packages:

```bash
npm install
npm --prefix backend/auth-service install
npm --prefix backend/user-service install
npm --prefix backend/game-service install
npm --prefix backend/community-service install
npm --prefix backend/ai-service install
```

Windows PowerShell alternative:

```powershell
npm install
npm --prefix backend/auth-service install
npm --prefix backend/user-service install
npm --prefix backend/game-service install
npm --prefix backend/community-service install
npm --prefix backend/ai-service install
```

## 4. Environment variables

Copy `.env.example` into each service folder and fill values. Required keys:

- `PORT` (3001-3005 per service)
- `MONGODB_URI` (all except AI service)
- `JWT_SECRET` (auth service)
- `GEMINI_API_KEY` (ai service)
- `NODE_ENV` (`development` or `production`)
- `CORS_ORIGIN` (frontend origin)

## 5. Start MongoDB

- Local install: `mongod`
- Docker Compose (from project root):

```bash
docker compose up -d mongodb mongo-express
```

## 6. Seed database

```bash
node scripts/seed-database.js
```

Use `--force` to clear existing data if needed.

## 7. Run services

- Individually (example for auth):

```bash
npm --prefix backend/auth-service run dev
```

- All via gateway dev script:

```bash
npm run dev
```

Services are available on 3001-3005; gateway serves SPA and proxies at the configured PORT (default 5173).

## 8. Verify health

```bash
node scripts/health-check.js
```

Expect all checks to return ✓ when services are up.

## 9. Test APIs

- Use Postman/Thunder Client with endpoints in `docs/API_TESTING.md`.
- Or curl examples:

```bash
curl http://localhost:3001/health
```

## 10. Troubleshooting

- Ensure MongoDB is reachable at `MONGODB_URI`.
- Check CORS_ORIGIN matches frontend origin.
- If ports are busy, change `PORT` values and update gateway env targets (`AUTH_SERVICE_URL`, etc.).
- Delete `node_modules` and reinstall if dependency issues persist.
