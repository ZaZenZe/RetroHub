# RetroHub

Retro gaming companion with AI assistance and a community hub for sharing tips, collections, and discussions.

![Node.js](https://img.shields.io/badge/Node.js-18+-43853d?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-Backend-000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-4ea94b?logo=mongodb&logoColor=white)
![Vanilla JS](https://img.shields.io/badge/Vanilla_JS-Frontend-f7df1e?logo=javascript&logoColor=000)
![Capacitor](https://img.shields.io/badge/Capacitor-Mobile-119eff?logo=capacitor&logoColor=white)

## Features

- Authentication and profiles
- Game collection tracking across GBA, DS, and 3DS
- Community forums with posts, replies, and votes
- AI chatbot for hints and walkthrough help
- Health endpoints for all services

## Project Structure

- frontend/ — static web shell (index.html, style.css, script.js, assets/)
- backend/ — microservices
  - auth-service/
  - user-service/
  - game-service/
  - community-service/
  - ai-service/
- docs/ — documentation
- .env.example — base environment defaults

## Setup

1. Prerequisites: Node.js 18+, npm, MongoDB (local or remote).
2. Clone the repository.
3. Copy .env.example to .env at the root (service-specific .env files are also scaffolded).
4. Install dependencies per service (commands below).
5. (Optional) Start MongoDB locally with Docker Compose; see the section below.

## Install & Run

### Frontend (static prototype)

- Location: frontend/
- Open index.html in a browser or serve with any static server.

### Backend microservices

Each service has placeholders; install dependencies as they are added.

| Service   | Path                      | Default Port |
| --------- | ------------------------- | ------------ |
| Auth      | backend/auth-service      | 3001         |
| User      | backend/user-service      | 3002         |
| Game      | backend/game-service      | 3003         |
| Community | backend/community-service | 3004         |
| AI        | backend/ai-service        | 3005         |

Example per service (replace <service>):

- Install: `cd backend/<service>-service && npm install`
- Run: `npm start`

### MongoDB with Docker Compose (optional)

- Ensure Docker is running.
- From the repository root:
  - Start: `docker compose up -d`
  - Stop: `docker compose down`
- Services:
  - MongoDB at localhost:27017
  - Mongo Express UI at http://localhost:8081

## Team

- Mark
- Sayan

## License

MIT
