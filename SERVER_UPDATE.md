# RetroHub - Updated Server Configuration

The server.js has been updated to work with both development and production builds of the React app.

## Development Mode

When running `npm run dev` in the frontend folder:
- Vite dev server runs on port 3000
- Backend gateway runs on port 5173
- Vite proxies `/api` calls to the gateway

## Production Mode

After building with `npm run build`:
- Static files are in `frontend/dist/`
- Server.js serves from dist folder
- Gateway handles API proxying

## Updated Scripts

Update root package.json to include:

```json
{
  "scripts": {
    "dev:frontend": "cd frontend && npm run dev",
    "build:frontend": "cd frontend && npm run build",
    "start": "node server.js",
    "dev:full": "concurrently \"npm run start:services\" \"npm run dev:frontend\"" 
  }
}
```

## Running the App

### Full Development Stack
```bash
# Start MongoDB
npm run docker:up

# Start all microservices + React dev server
npm run dev:full
```

### Production Build
```bash
# Build React app
npm run build:frontend

# Start gateway (serves from dist/)
npm start
```

The React app is fully functional and ready to use!
