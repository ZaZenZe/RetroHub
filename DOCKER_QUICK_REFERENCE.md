# Docker Quick Reference - RetroHub React

## 🚀 Quick Start Commands

```bash
# Start everything (with build)
docker compose up --build

# Start in background
docker compose up -d

# Stop all services
docker compose down

# Clean restart (remove volumes/data)
docker compose down -v && docker compose up --build
```

## 📦 Gateway-Specific Commands

```bash
# Rebuild only gateway after React changes
docker compose build --no-cache gateway
docker compose up gateway --force-recreate

# View gateway logs
docker compose logs -f gateway

# Access gateway container shell
docker compose exec gateway sh

# Check if dist/ folder exists in container
docker compose exec gateway ls -la /app/frontend/dist
```

## 🔍 Debugging Commands

```bash
# Check service health status
docker compose ps

# View logs for specific service
docker compose logs -f auth-service
docker compose logs -f gateway

# View all logs
docker compose logs -f

# Check MongoDB connection
docker compose exec mongodb mongosh -u retrohub -p retrohub

# Restart specific service
docker compose restart gateway
```

## 🧪 Verification Steps

After `docker compose up`, verify in this order:

1. **Check service status**: `docker compose ps` (all should be "healthy" or "running")
2. **Check gateway logs**: `docker compose logs gateway | grep "serving static files"`
   - Should show: `serving static files from: /app/frontend/dist`
3. **Open browser**: http://localhost:5173
4. **Check React DevTools**: Should detect React components
5. **Test API**: Network tab should show successful /api calls
6. **Check admin**: http://localhost:5173/admin
7. **Check database**: http://localhost:8081 (Mongo Express)

## 🛠️ Troubleshooting

### Gateway shows old vanilla JS version
```bash
# Force rebuild without cache
docker compose build --no-cache gateway
docker compose up --force-recreate gateway
```

### React app not loading (white screen)
```bash
# Check if build completed
docker compose exec gateway ls /app/frontend/dist
# Should show index.html, admin.html, assets/

# Check gateway logs for errors
docker compose logs gateway
```

### API calls fail (503 errors)
```bash
# Check microservices health
docker compose ps
# Wait for all services to be "healthy"

# Check specific service logs
docker compose logs auth-service
```

### MongoDB connection errors
```bash
# Restart MongoDB and seed
docker compose down
docker compose up mongodb -d
# Wait 10 seconds
docker compose up seed-db
docker compose up
```

## 📊 Port Reference

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| Gateway | 5173 | http://localhost:5173 | React app + API proxy |
| Auth | 3001 | Internal only | Authentication service |
| User | 3002 | Internal only | User management |
| Game | 3003 | Internal only | Game catalog |
| Community | 3004 | Internal only | Posts/comments |
| AI | 3005 | Internal only | Chatbot service |
| MongoDB | 27017 | mongodb://localhost:27017 | Database |
| Mongo Express | 8081 | http://localhost:8081 | DB admin UI |

## 🔄 Development Workflow

### Making React changes:
1. Edit files in `frontend/src/`
2. Rebuild gateway: `docker compose build gateway`
3. Restart gateway: `docker compose up gateway --force-recreate`
4. Refresh browser

### Making backend changes:
1. Edit files in `backend/*/`
2. Rebuild specific service: `docker compose build auth-service`
3. Restart service: `docker compose up auth-service --force-recreate`

### Testing locally without Docker:
```bash
# Terminal 1: Start microservices in Docker
docker compose up mongodb auth-service user-service game-service community-service ai-service

# Terminal 2: Start React dev server
cd frontend
npm run dev  # Runs on port 3000 with hot reload

# Terminal 3: Start gateway (proxies to Docker services)
npm run dev  # Runs on port 5173
```

## 🎯 Environment Files

Create `.env` file in project root for custom configuration:

```env
# MongoDB
MONGO_INITDB_ROOT_USERNAME=retrohub
MONGO_INITDB_ROOT_PASSWORD=retrohub

# JWT Secret (change in production!)
JWT_SECRET=your-secret-key-here

# Mongo Express
MONGO_EXPRESS_USERNAME=admin
MONGO_EXPRESS_PASSWORD=admin

# CORS
CORS_ORIGIN=http://localhost:5173

# AI Service (optional)
GEMINI_API_KEY=your-api-key-here
```

## 📈 Performance Tips

1. **Use Docker cache**: Don't use `--no-cache` unless necessary
2. **Multi-stage builds**: Already implemented in gateway Dockerfile
3. **Health checks**: Wait for services to be healthy before accessing
4. **Volume mounts**: Avoid mounting node_modules in production
5. **Resource limits**: Consider adding memory/CPU limits in docker-compose.yml

## 🔐 Security Notes

- Default credentials are for development only
- Change JWT_SECRET in production
- Use Docker secrets for sensitive data in production
- Don't expose MongoDB port 27017 in production
- Use environment-specific docker-compose files

## ✅ Success Indicators

When everything works correctly:

```bash
$ docker compose ps
NAME                  STATUS
retrohub-ai           Up (healthy)
retrohub-auth         Up (healthy)
retrohub-community    Up (healthy)
retrohub-game         Up (healthy)
retrohub-gateway      Up
retrohub-mongodb      Up (healthy)
retrohub-mongo-express Up
retrohub-user         Up (healthy)
```

```bash
$ docker compose logs gateway | grep serving
[gateway] serving static files from: /app/frontend/dist
```

```bash
$ curl -s http://localhost:5173 | grep "<div id=\"root\">"
<div id="root"></div>
```

## 🚨 Common Mistakes to Avoid

1. ❌ Forgetting to rebuild after React changes
2. ❌ Accessing gateway before services are healthy
3. ❌ Using old vanilla JS files instead of React build
4. ❌ Not checking gateway logs for build errors
5. ❌ Mixing local and Docker development (port conflicts)

## 📚 Related Documentation

- [DOCKER_INTEGRATION.md](DOCKER_INTEGRATION.md) - Full integration guide
- [REACT_REFACTORING_COMPLETE.md](REACT_REFACTORING_COMPLETE.md) - React quick start
- [frontend/README.md](frontend/README.md) - React development guide
- [COMPONENT_ARCHITECTURE.md](COMPONENT_ARCHITECTURE.md) - Component structure
