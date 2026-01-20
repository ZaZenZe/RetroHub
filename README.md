# RetroHub

Retro gaming companion with AI assistance and a community hub for sharing tips, collections, and discussions.

![Node.js](https://img.shields.io/badge/Node.js-20+-43853d?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18.3-61dafb?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-6.0-646cff?logo=vite&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-Backend-000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-4ea94b?logo=mongodb&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ed?logo=docker&logoColor=white)
![Capacitor](https://img.shields.io/badge/Capacitor-Mobile-119eff?logo=capacitor&logoColor=white)

## Roadmap
<img width="2548" height="1435" alt="Roadmap" src="https://github.com/user-attachments/assets/4c6a2ae7-a435-4883-9492-2f8607b45217" />

## Features

- 🔐 Authentication and user profiles
- 🎮 Game collection tracking across GBA, DS, and 3DS
- 💬 Community forums with posts, replies, and votes
- 🤖 AI chatbot for hints and walkthrough help
- ⚛️ **Modern React frontend** with hooks and Context API
- 🚀 **Optimized production builds** with Vite
- 🐳 **Full Docker integration** with multi-stage builds
- 📱 Health endpoints for all services

## Project Structure

- **frontend/** — React application (Vite + React Router)
  - `src/` — React components, pages, contexts, services
  - `dist/` — Production build output
  - Main app + separate admin panel
- **backend/** — Microservices architecture
  - `auth-service/` — Authentication & JWT tokens
  - `user-service/` — User profiles & stats
  - `game-service/` — Game catalog & CRUD
  - `community-service/` — Posts & community features
  - `ai-service/` — AI chatbot integration
  -Quick Start with Docker (Recommended)

The easiest way to run RetroHub is with Docker:

```bash
# Clone repository
git clone <repo-url>
cd RetroHub

# Start everything (React build + all services)
docker compose up --build

# Access the app
# Main app: http://localhost:5173
# Admin panel: http://localhost:5173/admin
# Database UI: http://localhost:8081
```

**See [DOCKER_QUICK_REFERENCE.md](DOCKER_QUICK_REFERENCE.md) for detailed Docker commands**

## Local Development Setup

1. **Prerequisites**: Node.js 20+, npm, MongoDB
2. Clone the repository
3. Copy `.env.example` to `.env`
4. Install dependencies (see commands below)
5. Start services individually or use Docker Compose

## Install & Run

### React Frontend (Development)

```bash
cd frontend
npm install
npm run dev  # Starts Vite dev server on port 3000 with hot reload
```

### React Frontend (Production Build)

```bash
cd frontend
npm install
npm run build  # Creates optimized dist/ folder
```

### Gateway Server

```bash
npm install
npm run dev  # Starts gateway on port 5173, proxies API calls
```

### Tooling Scripts

- Lint (ESLint v9 flat config): `npm run lint`
- Format (Prettier): `npm run format`
- Full dev mode: `npm run dev:full` (starts both frontend dev + gateway)

### Backend Microservices

Each service runs independently with its own dependencies.

| Service   | Path                      | Default Port | Purpose |
| --------- | ------------------------- | ------------ | ------- |
| Auth      | backend/auth-service      | 3001         | Login, register, JWT |
| User      | backend/user-service      | 3002         | Profiles, stats, achievements |
| Game      | backend/game-service      | 3003         | Game catalog, tips, FAQs |
| Community | backend/community-service | 3004         | Posts, replies, votes |
| AI        | backend/ai-service        | 3005         | Chatbot integration |

**Per service:**
```bash
cd backend/<service>-service
npm install
npm start
```

## Documentation

- **[REACT_REFACTORING_COMPLETE.md](REACT_REFACTORING_COMPLETE.md)** — Quick start for React version
- **[DOCKER_INTEGRATION.md](DOCKER_INTEGRATION.md)** — Complete Docker integration guide
- **[DOCKER_QUICK_REFERENCE.md](DOCKER_QUICK_REFERENCE.md)** — Docker command cheat sheet
- **[COMPONENT_ARCHITECTURE.md](COMPONENT_ARCHITECTURE.md)** — React component structure
- **[frontend/README.md](frontend/README.md)** — React development guide
- **[docs/](docs/)** — Additional architecture & setup docs

## Demo Accounts

After seeding the database:
- **Admin**: admin@test.com / password123
- **Moderator**: mod@test.com / password123
- **User**: user@test.com / password123

See [docs/SEEDED_ACCOUNTS.md](docs/SEEDED_ACCOUNTS.md) for full list.

## Tech Stack

### Frontend
- **React 18.3** — Component-based UI
- **React Router 6** — Client-side routing
- **Context API** — State management
- **Vite 6** — Build tool with HMR

### Backend
- **Node.js 20** — Runtime
- **Express 5.2** — Web framework
- **MongoDB 6** — Database
- **JWT** — Authentication
- **Mongoose** — ODM

### DevOps
- **Docker Compose** — Container orchestration
- **Multi-stage builds** — Optimized images
- **Health checks** — Service monitoring

## Architecture

RetroHub uses a **microservices architecture** with:
- **Gateway pattern**: Single entry point (server.js) proxies to backend services
- **Service isolation**: Each microservice has independent deployment
- **Shared models**: Common database models in backend/shared/
- **React SPA**: Single-page application with client-side routing
- **API-first design**: RESTful endpoints for all operations

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and [docs/GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md) for development guidelines.
- Services:
  - MongoDB at localhost:27017
  - Mongo Express UI at http://localhost:8081

## Team

- Mark
- Sayan

## License

MIT
