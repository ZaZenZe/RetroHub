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

**Demo accounts:** `admin@test.com` / `password123` (see [docs/SEEDED_ACCOUNTS.md](docs/SEEDED_ACCOUNTS.md))

## Project Structure

```
RetroHub/
├── frontend/              # React app (Vite + React Router)
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Route pages (Home, Profile, etc.)
│   │   ├── admin/         # Admin panel (separate app)
│   │   ├── context/       # State management (Auth, Games, Theme)
│   │   └── services/      # API client
│   ├── assets/            # Images, pixel art
│   └── dist/              # Production build (created by Vite)
│
├── backend/               # Microservices
│   ├── auth-service/      # Login, register, JWT (port 3001)
│   ├── user-service/      # Profiles, stats (port 3002)
│   ├── game-service/      # Game catalog, CRUD (port 3003)
│   ├── community-service/ # Posts, comments (port 3004)
│   ├── ai-service/        # AI chatbot (port 3005)
│   └── shared/            # Database models, middleware
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

# Terminal 3: Gateway
npm start
```

### Docker Development

```bash
# Start everything
docker compose up

# Rebuild after code changes
docker compose build gateway
docker compose up gateway --force-recreate

# View logs
docker compose logs -f gateway

# Clean restart
docker compose down -v
docker compose up
```

### Available Scripts

```bash
npm start              # Start gateway server
npm run dev:frontend   # Start React dev server (port 3000)
npm run build:frontend # Build React for production
npm run dev:full       # Start everything locally
npm run lint           # Run ESLint
npm run format         # Format with Prettier
```

## Tech Stack

**Frontend:** React 18, React Router 6, Context API, Vite 6  
**Backend:** Node.js 20, Express 5, MongoDB 6, Mongoose, JWT  
**DevOps:** Docker, Docker Compose, Multi-stage builds

## Architecture

Microservices architecture with API gateway pattern:
- Gateway (server.js) serves React app and proxies `/api/*` to backend services
- Each microservice is independent with its own container
- MongoDB with authentication and health checks
- React uses Context API for state (Auth, Games, Theme)
- Optimized production builds with code splitting

## Ports

| Service          | Port | URL                          |
|------------------|------|------------------------------|
| Gateway (React)  | 5173 | http://localhost:5173        |
| Auth Service     | 3001 | Internal only                |
| User Service     | 3002 | Internal only                |
| Game Service     | 3003 | Internal only                |
| Community Service| 3004 | Internal only                |
| AI Service       | 3005 | Internal only                |
| MongoDB          | 27017| mongodb://localhost:27017    |
| Mongo Express    | 8081 | http://localhost:8081        |

## Demo Accounts

After running `docker compose up`, the database is seeded with:

- **Admin:** admin@test.com / password123
- **Moderator:** mod@test.com / password123
- **User:** user@test.com / password123

Full list in [docs/SEEDED_ACCOUNTS.md](docs/SEEDED_ACCOUNTS.md)

## License

MIT
