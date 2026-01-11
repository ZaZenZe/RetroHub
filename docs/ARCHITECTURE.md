# RetroHub Architecture

## System Overview

RetroHub is a microservices-based backend with a lightweight SPA frontend. A Node.js gateway (server.js) serves static assets and proxies API traffic to five domain services. MongoDB backs all stateful services; the AI service remains stateless.

```
[Frontend SPA]
    |
    v
[Gateway (Express + http-proxy-middleware)]
    | /api/auth     -> Auth Service (3001) -> MongoDB
    | /api/users    -> User Service (3002) -> MongoDB
    | /api/games    -> Game Service (3003) -> MongoDB
    | /api/community-> Community Service (3004) -> MongoDB
    | /api/chat     -> AI Service (3005) -> Gemini API (stateless)
```

## Microservices

- **Auth Service (3001):** registration, login/logout, token validation; owns user credentials.
- **User Service (3002):** profiles, stats, achievements, and user game collections.
- **Game Service (3003):** game catalog with tips and FAQs.
- **Community Service (3004):** posts, replies, votes for forums.
- **AI Service (3005):** chat endpoint; no database; integrates Gemini via utility.

## Data Flow

- **User auth:** SPA -> Gateway `/api/auth/*` -> Auth -> MongoDB; JWT issued and later verified by other services.
- **Profile & progress:** SPA -> Gateway `/api/users/*` -> User Service -> MongoDB; guarded by JWT middleware.
- **Catalog reads:** SPA -> Gateway `/api/games/*` -> Game Service -> MongoDB; public endpoints.
- **Forum interactions:** SPA -> Gateway `/api/community/*` -> Community Service -> MongoDB; writes require JWT.
- **AI chat:** SPA -> Gateway `/api/chat` -> AI Service -> Gemini; responses are stateless.

## Technology Stack

- **Runtime:** Node.js 18+
- **Framework:** Express across gateway and services
- **Database:** MongoDB (via mongoose) for auth, user, game, community
- **AI integration:** Gemini client placeholder in `backend/ai-service/utils/gemini.js`
- **Tooling:** ESLint, Prettier, Husky, lint-staged, nodemon, concurrently

## Database Schema Relationships

- **Users** link to **UserStats**, **UserGames**, **Achievements**, **Posts**, **Replies**.
- **Games** link to **Tips**, **FAQs**, **Posts**.
- **Posts** link to **Replies** and reference **Users** and **Games**.
- **UserGames** provide user/game junction with status and progress.
- **Achievements** and **UserStats** are per-user aggregates.

## API Gateway Pattern

`server.js` acts as an API gateway: serves the SPA, proxies `/api/*` routes to each service, applies JSON body limits, and centralizes service endpoint configuration via environment variables.

## Security Considerations

- JWT-based auth; `Authorization: Bearer <token>` validated by shared middleware.
- CORS configured per service using shared options; origins driven by env vars.
- Input size limits on JSON bodies (1MB) to reduce abuse.
- Error handling middleware standardizes responses and hides internals.

## Scalability Notes

- Each service can scale independently behind the gateway.
- Stateless AI service can be horizontally scaled easily.
- MongoDB can be hosted as a managed cluster; add indexes noted in schemas for query performance.
- Use environment variables to point gateway proxies at containerized or cloud-hosted services.
