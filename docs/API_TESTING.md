# API Testing Guide

Use these references to exercise each service locally. Base URLs assume services are running on localhost with ports 3001-3005. Authenticated calls require a JWT in the `Authorization: Bearer <token>` header (use auth-service /login to obtain a token).

Import tips:

- Postman/Thunder Client: create a collection and set a `baseUrl` variable if desired.
- curl: examples are provided inline; adjust payloads as needed.

## Health Endpoints (all services)

- GET http://localhost:3001/health
- GET http://localhost:3002/health
- GET http://localhost:3003/health
- GET http://localhost:3004/health
- GET http://localhost:3005/health

## 1) Auth Service (3001)

- POST /register
  - URL: http://localhost:3001/register
  - Headers: Content-Type: application/json
  - Body: { "email": "user@example.com", "username": "player1", "password": "secret123" }
  - Expected: 201, JSON with user and token; 409 if email/username taken; 400 if missing fields.
- POST /login
  - URL: http://localhost:3001/login
  - Headers: Content-Type: application/json
  - Body: { "email": "user@example.com", "password": "secret123" }
  - Expected: 200 with user and token; 401 for invalid credentials.
- POST /logout
  - URL: http://localhost:3001/logout
  - Expected: 200 { message: "Logged out" }
- GET /validate
  - URL: http://localhost:3001/validate
  - Headers: Authorization: Bearer <token>
  - Expected: 200 with user; 401/403 if token missing or invalid.

## 2) User Service (3002)

- GET /users/:id
  - URL: http://localhost:3002/users/<userId>
  - Headers: Authorization: Bearer <token>
  - Expected: 200 with user; 403 if token user differs; 404 if not found.
- PUT /users/:id
  - URL: http://localhost:3002/users/<userId>
  - Headers: Content-Type: application/json, Authorization: Bearer <token>
  - Body: { "avatarUrl": "https://...", "username": "newName", "password": "newpass123" }
  - Expected: 200 with updated user; 400 for short password; 409 if username taken.
- GET /users/:id/stats
  - URL: http://localhost:3002/users/<userId>/stats
  - Headers: Authorization: Bearer <token>
  - Expected: 200 with stats object.
- GET /users/:id/achievements
  - URL: http://localhost:3002/users/<userId>/achievements
  - Headers: Authorization: Bearer <token>
  - Expected: 200 with achievements array.
- POST /users/:id/games
  - URL: http://localhost:3002/users/<userId>/games
  - Headers: Content-Type: application/json, Authorization: Bearer <token>
  - Body: { "gameId": "<gameObjectId>", "status": "PLAYING", "progressPercentage": 15 }
  - Expected: 201 with userGame; 400 for invalid input; 404 if game missing.
- DELETE /users/:id/games/:gameId
  - URL: http://localhost:3002/users/<userId>/games/<gameId>
  - Headers: Authorization: Bearer <token>
  - Expected: 200 { removed: true|false }.

## 3) Game Service (3003)

- GET /games
  - URL: http://localhost:3003/games?q=pokemon&platform=DS
  - Expected: 200 with games list.
- GET /games/:id
  - URL: http://localhost:3003/games/<gameId>
  - Expected: 200 with game; 404 if missing; 400 if id invalid.
- GET /games/:id/tips
  - URL: http://localhost:3003/games/<gameId>/tips
  - Expected: 200 with tips array.
- GET /games/:id/faqs
  - URL: http://localhost:3003/games/<gameId>/faqs
  - Expected: 200 with faqs array.

## 4) Community Service (3004)

- GET /games/:gameId/posts
  - URL: http://localhost:3004/games/<gameId>/posts
  - Expected: 200 with posts array.
- POST /games/:gameId/posts
  - URL: http://localhost:3004/games/<gameId>/posts
  - Headers: Content-Type: application/json, Authorization: Bearer <token>
  - Body: { "content": "Great game!", "isSpoiler": false }
  - Expected: 201 with post; 404 if game missing; 400 if content empty.
- GET /posts/:postId/replies
  - URL: http://localhost:3004/posts/<postId>/replies
  - Expected: 200 with replies array.
- POST /posts/:postId/replies
  - URL: http://localhost:3004/posts/<postId>/replies
  - Headers: Content-Type: application/json, Authorization: Bearer <token>
  - Body: { "content": "Nice tip" }
  - Expected: 201 with reply; 404 if post missing.
- POST /posts/:postId/vote
  - URL: http://localhost:3004/posts/<postId>/vote
  - Headers: Content-Type: application/json, Authorization: Bearer <token>
  - Body: { "direction": "up" } (or "down")
  - Expected: 200 with upvotes/downvotes; 400 if direction invalid.

## 5) AI Service (3005)

- POST /chat
  - URL: http://localhost:3005/chat
  - Headers: Content-Type: application/json, Authorization: Bearer <token>
  - Body: { "prompt": "Give me a leveling route" }
  - Expected: 200 { text: "..." }; 400 if prompt missing.

## Quick curl examples

```sh
# Register
curl -X POST http://localhost:3001/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","username":"player1","password":"secret123"}'

# Login (capture token)
TOKEN=$(curl -s -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret123"}' | jq -r .token)

# List games
curl http://localhost:3003/games

# Call AI chat
curl -X POST http://localhost:3005/chat \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"prompt":"Best starter?"}'
```
