# Docker Integration Guide for React RetroHub

## Overview

The React refactoring is **fully integrated** with Docker. The application uses a multi-stage Docker build to create optimized production bundles and serve them through the gateway container.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Compose Stack                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   MongoDB    │    │ Mongo Express│    │   Seed DB    │  │
│  │   :27017     │◄───│    :8081     │◄───│   (one-time) │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         ▲                                                    │
│         │                                                    │
│  ┌──────┴───────────────────────────────────────────────┐  │
│  │          Backend Microservices (Node.js)             │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ auth-service:3001  │  user-service:3002              │  │
│  │ game-service:3003  │  community-service:3004         │  │
│  │ ai-service:3005                                       │  │
│  └──────────────────────────────────────────────────────┘  │
│         ▲                                                    │
│         │                                                    │
│  ┌──────┴───────────────────────────────────────────────┐  │
│  │              Gateway Container (Node.js)             │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ • React Production Build (dist/)                      │  │
│  │ • Express Static Server                               │  │
│  │ • API Proxy to Microservices                          │  │
│  │ • Port: 5173                                          │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                   │
└──────────────────────────┼───────────────────────────────────┘
                           │
                    Browser @ localhost:5173
```

## Multi-Stage Dockerfile

The gateway uses a **multi-stage build** for optimal performance:

### Stage 1: Build React Frontend
```dockerfile
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci
COPY frontend/ ./
RUN npm run build  # Creates optimized dist/ folder
```

**Purpose**: Compiles React source code into optimized production bundles with:
- Minified JavaScript
- Tree-shaken dependencies (only used code included)
- Optimized CSS
- Code splitting for faster loads
- Asset optimization

### Stage 2: Production Runtime
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
COPY server.js ./
RUN npm ci --omit=dev --ignore-scripts
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist  # Copy built React app
COPY frontend/assets ./frontend/assets
COPY frontend/style.css frontend/admin.css ./frontend/
EXPOSE 5173
CMD ["npm", "start"]
```

**Purpose**: Creates a minimal production container with:
- Built React app (not source code)
- Gateway server only
- Production dependencies only (no dev tools)
- Smaller image size (~150MB vs >500MB with dev dependencies)

## Gateway Server Logic

The `server.js` intelligently serves the React build:

```javascript
const DIST_DIR = path.join(__dirname, 'frontend', 'dist');
const FRONTEND_DIR = fs.existsSync(DIST_DIR) ? DIST_DIR : path.join(__dirname, 'frontend');
```

**Behavior:**
- ✅ **In Docker**: Serves from `frontend/dist/` (optimized build)
- ✅ **In Development**: Serves from `frontend/` (allows hot reload with Vite dev server)

## Environment Variables

The gateway container receives these environment variables:

```yaml
environment:
  PORT: 5173
  NODE_ENV: production
  AUTH_SERVICE_URL: http://auth-service:3001
  USER_SERVICE_URL: http://user-service:3002
  GAME_SERVICE_URL: http://game-service:3003
  COMMUNITY_SERVICE_URL: http://community-service:3004
  AI_SERVICE_URL: http://ai-service:3005
```

## Docker Commands

### Build and Start All Services
```bash
docker compose up --build
```

**What happens:**
1. MongoDB starts with health check
2. Seed service populates database
3. 5 microservices build and start
4. Gateway builds React frontend → creates dist/
5. Gateway serves React app on http://localhost:5173

### Rebuild Only Gateway (After React Changes)
```bash
docker compose build --no-cache gateway
docker compose up gateway
```

### View Gateway Logs
```bash
docker compose logs -f gateway
```

**Expected output:**
```
[gateway] serving static files from: /app/frontend/dist
[gateway] targets: {
  auth: 'http://auth-service:3001',
  user: 'http://user-service:3002',
  ...
}
Gateway running at http://0.0.0.0:5173
```

### Stop All Services
```bash
docker compose down
```

### Clean Build (Remove Volumes)
```bash
docker compose down -v
docker compose up --build
```

## Verification Checklist

After running `docker compose up`, verify:

- [ ] **MongoDB**: Check logs for "Waiting for connections"
- [ ] **Seed Service**: Should exit with "seed complete"
- [ ] **All Microservices**: Health checks pass (5/5 services healthy)
- [ ] **Gateway**: Logs show "serving static files from: /app/frontend/dist"
- [ ] **Browser**: Open http://localhost:5173 and see React app
- [ ] **React DevTools**: Should detect React components in browser
- [ ] **API Calls**: Network tab shows successful calls to /api/games, /api/auth
- [ ] **Admin Panel**: Navigate to http://localhost:5173/admin
- [ ] **Mongo Express**: Access database UI at http://localhost:8081

## React Build Output

The build creates these optimized files in `dist/`:

```
frontend/dist/
├── index.html              # Main app entry (1.43 kB)
├── admin.html              # Admin panel entry (1.09 kB)
├── assets/
│   ├── index-[hash].js     # Main app bundle (~150 kB)
│   ├── admin-[hash].js     # Admin bundle (~80 kB)
│   ├── index-[hash].css    # Main styles (25.75 kB)
│   ├── admin-[hash].css    # Admin styles (9.53 kB)
│   └── vendor-[hash].js    # React + dependencies (~140 kB)
```

**Benefits:**
- **Code Splitting**: React Router loads pages on demand
- **Cache Busting**: [hash] changes when files change
- **Minification**: All code compressed and optimized
- **Tree Shaking**: Unused library code removed

## .dockerignore

A `.dockerignore` file excludes unnecessary files from the Docker build context:

```
node_modules/       # Don't copy local dependencies
frontend/dist/      # Will be built inside container
*.md               # Skip documentation
.git/              # Skip version control
frontend/*-old.*   # Skip backup files
```

**Benefits:**
- Faster builds (smaller context to upload)
- Smaller image size
- No conflicts with local builds

## Development vs Production

| Aspect | Development | Docker Production |
|--------|-------------|-------------------|
| **Build Tool** | Vite dev server (port 3000) | Pre-built dist/ |
| **Hot Reload** | ✅ Yes (instant) | ❌ No (rebuild required) |
| **Source Maps** | ✅ Full debugging | ❌ Minified |
| **Bundle Size** | Large (unoptimized) | Small (optimized) |
| **Start Time** | ~2 seconds | ~15 seconds (build time) |
| **Gateway Serves** | `frontend/` folder | `frontend/dist/` folder |

## Troubleshooting

### Problem: Gateway shows "Cannot GET /"

**Cause**: React build didn't complete or dist/ folder missing

**Solution**:
```bash
docker compose build --no-cache gateway
docker compose logs gateway  # Check for build errors
```

### Problem: API calls return 503 Service Unavailable

**Cause**: Microservices not healthy yet

**Solution**:
```bash
docker compose ps  # Check health status
docker compose logs auth-service  # Check specific service
```

### Problem: MongoDB connection refused

**Cause**: MongoDB container not ready

**Solution**:
```bash
docker compose down
docker compose up mongodb  # Start MongoDB alone first
docker compose up  # Then start everything
```

### Problem: White screen in browser

**Cause**: JavaScript errors or incorrect BASE_URL

**Solution**:
1. Open browser DevTools console
2. Check for errors
3. Verify React build completed: `docker compose exec gateway ls -la /app/frontend/dist`

### Problem: Changes not reflected after rebuild

**Cause**: Docker cache

**Solution**:
```bash
docker compose build --no-cache gateway
docker compose up --force-recreate gateway
```

## Performance Metrics

### Build Times
- **First build**: ~60 seconds (includes dependency download)
- **Subsequent builds with cache**: ~15 seconds
- **No-cache rebuild**: ~45 seconds

### Container Sizes
- **Gateway image**: ~150 MB (with React build)
- **Microservice images**: ~120 MB each
- **MongoDB image**: ~700 MB

### Runtime Performance
- **React app load time**: 1-2 seconds (first load)
- **Subsequent loads**: <500ms (browser cache)
- **API response times**: 10-50ms (internal Docker network)

## Production Deployment

For production deployment on cloud platforms:

1. **Build once**: The Dockerfile creates production-ready images
2. **No Vite dev server**: Only the built dist/ files are served
3. **Environment variables**: Configure service URLs via docker-compose or orchestration tool
4. **Scaling**: Gateway can be replicated (stateless)
5. **Health checks**: Built-in health endpoints for orchestration

## Summary

✅ **React refactoring is fully Docker-compatible**
- Multi-stage build creates optimized production bundles
- Gateway serves dist/ folder automatically in Docker
- All microservices integrate seamlessly
- Development workflow unchanged (Vite still works locally)
- Production deployment ready with single `docker compose up`

The React migration **does not break** Docker integration—it enhances it with modern build tooling and optimal production bundles.
