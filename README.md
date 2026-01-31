# 🎮 RetroHub

> Modern retro gaming companion with AI assistance and community features

[![Node.js](https://img.shields.io/badge/Node.js-20+-43853d?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6-4ea94b?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ed?logo=docker&logoColor=white)](https://www.docker.com/)

## Features

🎮 **Game Library** - Browse and track GBA, DS, and 3DS games  
💬 **Community** - Share tips, strategies, and discussions  
🤖 **AI Assistant** - Get hints and walkthroughs  
👤 **User Profiles** - Track achievements and collections  
🔐 **Authentication** - Secure user accounts with JWT  
⚡ **Modern Stack** - React + Vite + Microservices

## Quick Start

**Prerequisites:** Docker & Docker Compose

```bash
# Clone and start
git clone https://github.com/ZaZenZe/RetroHub.git
cd RetroHub
docker compose up

# Access the app at http://localhost:5173
```

**Demo accounts:** See [docs/SEEDED_ACCOUNTS.md](docs/SEEDED_ACCOUNTS.md) for all seeded users, including:
- Admin: `admin@retrohub.test` / `Admin@123`
- Moderator: `mod@retrohub.test` / `Mod@123`
- Users: `retroGamer88` / `RetroGamer@88`, `PixelMaster` / `PixelM@ster!`, and more

## Project Structure

```
RetroHub/
├── frontend/              # React app (Vite + React Router)
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Route pages (Home, Profile, etc.)
│   │   ├── admin/         # Admin/mod panel (games, mods, CRUD)
│   │   ├── context/       # State management (Auth, Games, Theme)
│   │   └── services/      # API client
│   ├── assets/            # Images, pixel art
│   └── dist/              # Production build (created by Vite)
│
├── backend/               # Microservices
│   ├── auth-service/      # Login, register, JWT (port 3001)
│   ├── user-service/      # Profiles, stats, achievements (port 3002)
│   ├── game-service/      # Game catalog, CRUD, tips, faqs, mod assignment (port 3003)
│   ├── community-service/ # Posts, replies, votes, spoilers (port 3004)
│   ├── ai-service/        # AI chatbot (Gemini, port 3005)
│   └── shared/            # Database models, middleware, utils
│
├── server.js              # API gateway (port 5173)
├── docker-compose.yml     # Full stack orchestration
└── docs/                  # Documentation
```

## Development

### Local Development (Without Docker)

```bash
# Install dependencies
npm install
cd frontend && npm install && cd ..

# Start MongoDB
docker compose up mongodb -d

# Terminal 1: Backend services
npm run start:services

# Terminal 2: React dev server (with hot reload)
npm run dev:frontend

# Terminal 3: Gateway (API + static frontend)
npm start
```

### Docker Development

```bash
# Start everything (gateway, all services, MongoDB, seeding)
docker compose up

# Rebuild after code changes (gateway example)
docker compose build gateway
docker compose up gateway --force-recreate

# View logs for gateway
docker compose logs -f gateway

# Clean restart (removes volumes)
docker compose down -v
docker compose up
```

### Available Scripts (root)

```bash
npm start                # Start gateway server (API + static frontend)
npm run dev:frontend     # Start React dev server (frontend/src, port 5173)
npm run build:frontend   # Build React for production
npm run dev:full         # Start all backend services + frontend (dev)
npm run lint             # Run ESLint on backend
npm run format           # Format with Prettier
```

## Tech Stack

**Frontend:** React 18, React Router 6, Context API, Vite 5, Capacitor, PWA  
**Backend:** Node.js 20, Express 5, MongoDB 6, Mongoose, JWT, Gemini AI  
**DevOps:** Docker, Docker Compose, Multi-stage builds

## Architecture


**Architecture:**
- API gateway (server.js) serves React app and proxies `/api/*` to backend services
- Microservices: auth, user, game, community, ai (Gemini)
- MongoDB with authentication and health checks
- React Context API for state (Auth, Games, Theme)
- Admin/mod panel for game CRUD, mod assignment
- Optimized production builds with code splitting

## Ports

| Service            | Port   | URL/Notes                       |
|--------------------|--------|---------------------------------|
| Gateway (API+UI)   | 5173   | http://localhost:5173           |
| Auth Service       | 3001   | http://localhost:3001 (internal) |
| User Service       | 3002   | http://localhost:3002 (internal) |
| Game Service       | 3003   | http://localhost:3003 (internal) |
| Community Service  | 3004   | http://localhost:3004 (internal) |
| AI Service         | 3005   | http://localhost:3005 (internal) |
| MongoDB            | 27017  | mongodb://localhost:27017        |
| Mongo Express      | 8081   | http://localhost:8081            |

## Seeded Accounts & Content

After running `docker compose up`, the database is seeded with:

- **Re-seeding manually:** `docker compose run --rm seed-db` (this runs `scripts/seed-database.js` and `scripts/seed-users-posts.js`)

### Environment & Secrets

- **JWT_SECRET** - JSON Web Token secret used by auth and services. Set in `.env` or Docker env `JWT_SECRET` (default in compose is `dev-secret-change-me`).
- **MONGODB_URI / MONGO_INITDB_ROOT_USERNAME / MONGO_INITDB_ROOT_PASSWORD** - MongoDB connection credentials. See `docker-compose.yml` for defaults.
- **GEMINI_API_KEY / GEMINI_MODEL** - Required for AI service to use Google Gemini models. If not set, AI endpoints return 503 and fallback behavior is used.
- **CORS_ORIGIN** - Comma-separated allowed origins for services (defaults include `http://localhost` and `capacitor://localhost`).

These env vars are referenced in each service's `Dockerfile` / `server.js` and `docker-compose.yml`. Ensure they are set for production deployments.

After running `docker compose up`, the database is seeded with:

- **Admin:** admin@retrohub.test / Admin@123
- **Moderator:** mod@retrohub.test / Mod@123
- **Users:** retroGamer88 / RetroGamer@88, PixelMaster / PixelM@ster!, ClassicFan / Classic@Fan99, SpeedRunner / SpeedRun@2024, NostalgiaKid / Nostalgia@90s, and more
- **Extra:** mainadmin@example.com / Admin123!, mod1@example.com / Mod123!, user1@example.com / User123!

See [docs/SEEDED_ACCOUNTS.md](docs/SEEDED_ACCOUNTS.md) for the full list.

Seeded content includes:
- Games: Fire Red, Emerald, Heart Gold, Platinum, Black 2, Y, and more
- Tips, FAQs, and sample community posts/replies

## Features

- Game library: Browse, search, and filter by platform/year
- Game detail: Tips, FAQs, screenshots, favorite, achievements
- Community: Posts, replies, votes, spoilers, user stats
- AI Assistant: Gemini-powered hints, walkthroughs, character selection
- User profiles: Achievements, stats, collections, favorites
- Authentication: JWT, secure sessions
- Admin/mod panel: Game CRUD, assign moderators, manage tips/FAQs
- Supported platforms: GBA, DS, 3DS, NES, SNES, GB, GBC, N64, GameCube, Dreamcast, Sega, PlayStation, PC, Arcade, and more
- PWA & Android (Capacitor) support

## License

MIT
